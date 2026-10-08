using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    if (builder.Environment.IsDevelopment())
    {
        connectionString = "Host=localhost;Database=agenda_saude;Username=postgres;Password=postgres";
    }
    else
    {
        throw new InvalidOperationException(
            "ConnectionStrings:DefaultConnection não configurada. Defina a variável de ambiente ConnectionStrings__DefaultConnection.");
    }
}

AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString));

var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    if (builder.Environment.IsDevelopment())
    {
        jwtKey = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        Console.WriteLine("AVISO: Jwt:Key não configurada. Gerando chave EFÊMERA de desenvolvimento (tokens serão invalidados a cada reinício).");
        Console.WriteLine("Para persistir, defina 'Jwt:Key' (ex.: variável de ambiente Jwt__Key) com ao menos 32 caracteres.");
    }
    else
    {
        throw new InvalidOperationException(
            "Jwt:Key não configurada. Defina 'Jwt:Key' (ex.: variável de ambiente Jwt__Key) com ao menos 32 caracteres aleatórios.");
    }
}

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException(
        "'Jwt:Key' deve ter no mínimo 32 bytes (256 bits) para assinatura HMAC-SHA256.");
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
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy =>
        policy.RequireClaim(ClaimTypes.Role, "Admin"));
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"erro\":\"Muitas requisições. Tente novamente em instantes.\"}", cancellationToken);
    };

    // Limite global: por usuário autenticado, com fallback para IP.
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var usuarioId = httpContext.User.Identity?.IsAuthenticated == true
            ? httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        var chave = !string.IsNullOrEmpty(usuarioId)
            ? $"user:{usuarioId}"
            : $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

        return RateLimitPartition.GetFixedWindowLimiter(chave, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 200,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });

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

    options.AddPolicy("publico", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ =>
            new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0
            });
    });
});

builder.Services.AddScoped<TokenService>(_ => new TokenService(jwtKey, builder.Configuration["Jwt:Issuer"], builder.Configuration["Jwt:Audience"]));
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AgendamentoService>();
builder.Services.AddScoped<CadastroService>();
builder.Services.AddScoped<UsuariosService>();
builder.Services.AddScoped<IEmailSender, SmtpEmailSender>();
builder.Services.AddScoped<ResetSenhaService>();

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
        if (origins.Length > 0)
        {
            policy.WithOrigins(origins).AllowAnyMethod().AllowAnyHeader();
        }
    });
});

var app = builder.Build();

app.UseForwardedHeaders();

app.UseExceptionHandler(error =>
{
    error.Run(async context =>
    {
        var feature = context.Features.Get<IExceptionHandlerFeature>();
        app.Logger.LogError(feature?.Error, "Erro não tratado em {Metodo} {Path}",
            context.Request.Method, context.Request.Path);

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsync("{\"erro\":\"Erro interno do servidor\"}");
    });
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}
else
{
    app.MapOpenApi();
}

app.UseCors(app.Environment.IsDevelopment() ? "AllowDevelopment" : "AllowProduction");
app.UseAuthentication();
app.UseRateLimiter();
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

    // Create ResetTokens table if it doesn't exist
    db.Database.ExecuteSqlRaw("""
        CREATE TABLE IF NOT EXISTS "ResetTokens" (
            "Id" UUID NOT NULL DEFAULT gen_random_uuid(),
            "UsuarioId" UUID NOT NULL,
            "TokenHash" VARCHAR(200) NOT NULL,
            "CriadoEm" TIMESTAMP NOT NULL DEFAULT NOW(),
            "ExpiraEm" TIMESTAMP NOT NULL,
            "Usado" BOOLEAN NOT NULL DEFAULT FALSE,
            CONSTRAINT "PK_ResetTokens" PRIMARY KEY ("Id"),
            CONSTRAINT "FK_ResetTokens_Usuarios_UsuarioId" FOREIGN KEY ("UsuarioId") REFERENCES "Usuarios"("Id") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS "IX_ResetTokens_UsuarioId" ON "ResetTokens" ("UsuarioId");
        CREATE INDEX IF NOT EXISTS "IX_ResetTokens_TokenHash" ON "ResetTokens" ("TokenHash");
    """);
}

app.Run();
