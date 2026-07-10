using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Host=localhost;Database=agenda_saude;Username=postgres;Password=postgres";

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
    Console.WriteLine("=================================================");
    Console.WriteLine("AVISO: Jwt:Key nao configurada. Chave gerada automaticamente.");
    Console.WriteLine($"JWT_KEY={jwtKey}");
    Console.WriteLine("Configure a variavel de ambiente JWT_KEY para persistir.");
    Console.WriteLine("=================================================");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AgendaSaude",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AgendaSaudeApp",
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim(ClaimTypes.Role, "Admin"));
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy("auth", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetTokenBucketLimiter(ip, _ =>
            new TokenBucketRateLimiterOptions
            {
                TokenLimit = 10,
                ReplenishmentPeriod = TimeSpan.FromMinutes(1),
                TokensPerPeriod = 10,
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });
});

builder.Services.AddScoped<TokenService>(_ => new TokenService(jwtKey, builder.Configuration["Jwt:Issuer"], builder.Configuration["Jwt:Audience"]));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AgendamentoService>();
builder.Services.AddScoped<CadastroService>();
builder.Services.AddScoped<UsuariosService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowDevelopment", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
    options.AddPolicy("AllowProduction", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? [];
        policy.WithOrigins(origins)
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler(error =>
{
    error.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"erro\":\"Erro interno do servidor\"}");
    });
});

app.UseCors(app.Environment.IsDevelopment() ? "AllowDevelopment" : "AllowProduction");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();

    // Migrate missing columns for existing databases
    db.Database.ExecuteSqlRaw("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='Tema') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "Tema" VARCHAR(20) NOT NULL DEFAULT 'light';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='CorPrimaria') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "CorPrimaria" VARCHAR(7) NOT NULL DEFAULT '#059669';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='CorSecundaria') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "CorSecundaria" VARCHAR(7) NOT NULL DEFAULT '#10b981';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='CorDestaque') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "CorDestaque" VARCHAR(7) NOT NULL DEFAULT '#f59e0b';
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='Icone') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "Icone" VARCHAR(30) NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Consultorios' AND column_name='DiasAgenda') THEN
                ALTER TABLE "Consultorios" ADD COLUMN "DiasAgenda" INT NOT NULL DEFAULT 2;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Servicos' AND column_name='SemProfissional') THEN
                ALTER TABLE "Servicos" ADD COLUMN "SemProfissional" BOOLEAN NOT NULL DEFAULT FALSE;
            END IF;
        END $$;
    """);

    // Make HorariosDisponiveis.ProfissionalId nullable for clinic-wide hours
    db.Database.ExecuteSqlRaw("""
        DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='HorariosDisponiveis' AND column_name='ProfissionalId' AND is_nullable = 'NO') THEN
                ALTER TABLE "HorariosDisponiveis" ALTER COLUMN "ProfissionalId" DROP NOT NULL;
            END IF;
        END $$;
    """);

    // Add ServicoId nullable to HorariosDisponiveis for service-specific hours
    db.Database.ExecuteSqlRaw("""
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='HorariosDisponiveis' AND column_name='ServicoId') THEN
                ALTER TABLE "HorariosDisponiveis" ADD COLUMN "ServicoId" UUID NULL;
            END IF;
        END $$;
    """);

    // Create ProfissionalServico table if it doesn't exist
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "ProfissionaisServicos" (
            "ProfissionalId" UUID NOT NULL,
            "ServicoId" UUID NOT NULL,
            CONSTRAINT "PK_ProfissionaisServicos" PRIMARY KEY ("ProfissionalId", "ServicoId"),
            CONSTRAINT "FK_ProfissionaisServicos_Profissionais_ProfissionalId" FOREIGN KEY ("ProfissionalId") REFERENCES "Profissionais"("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_ProfissionaisServicos_Servicos_ServicoId" FOREIGN KEY ("ServicoId") REFERENCES "Servicos"("Id") ON DELETE CASCADE
        );
    """);

    // Create HistoricoAcoes table if it doesn't exist
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "HistoricoAcoes" (
            "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "ConsultorioId" UUID NOT NULL,
            "UsuarioId" UUID NULL,
            "Acao" VARCHAR(50) NOT NULL,
            "Entidade" VARCHAR(50) NOT NULL,
            "EntidadeId" VARCHAR(50) NULL,
            "Detalhes" VARCHAR(2000) NULL,
            "DataHora" TIMESTAMP NOT NULL DEFAULT NOW(),
            CONSTRAINT "PK_HistoricoAcoes" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_HistoricoAcoes_Consultorios_ConsultorioId" FOREIGN KEY ("ConsultorioId") REFERENCES "Consultorios"("Id") ON DELETE CASCADE,
            CONSTRAINT "FK_HistoricoAcoes_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios"("Id") ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS "IX_HistoricoAcoes_ConsultorioId" ON "HistoricoAcoes" ("ConsultorioId");
        CREATE INDEX IF NOT EXISTS "IX_HistoricoAcoes_DataHora" ON "HistoricoAcoes" ("DataHora");
    """);
}

app.Run();
