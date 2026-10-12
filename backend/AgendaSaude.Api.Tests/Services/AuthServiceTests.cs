using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgendaSaude.Api.Tests.Services;

public class AuthServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AuthService _authService;
    private readonly TokenService _tokenService;
    private readonly FakeNeonValidator _neonValidator = new();
    private const string JwtKey = "test-key-for-auth-service-tests-32-chars-min";

    public AuthServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _tokenService = new TokenService(JwtKey, "Test", "Test");
        _authService = new AuthService(_context, _tokenService, new RefreshTokenService(_context), _neonValidator);
    }

    public void Dispose() => _context.Dispose();

    // ── CadastroConsultorioAsync ──

    [Fact]
    public async Task CadastrarConsultorio_DeveCriarConsultorioEUsuario()
    {
        var request = new CadastroConsultorioRequest(
            "Clínica Teste", "clinica@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);

        var result = await _authService.CadastrarConsultorioAsync(request);

        Assert.NotNull(result);
        Assert.Equal("Clínica Teste", result.NomeFantasia);
        Assert.Equal("clinica@test.com", result.Email);
        Assert.NotEqual(Guid.Empty, result.Id);

        var usuario = await _context.Usuarios.FirstAsync(u => u.Email == "clinica@test.com");
        Assert.Equal(PerfilUsuario.Admin, usuario.Perfil);
        Assert.True(BCrypt.Net.BCrypt.Verify("senha123", usuario.SenhaHash));
        Assert.Equal(result.Id, usuario.ConsultorioId);
    }

    [Fact]
    public async Task CadastrarConsultorio_EmailDuplicado_DeveRetornarNull()
    {
        var request = new CadastroConsultorioRequest(
            "Clínica 1", "clinica@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);

        await _authService.CadastrarConsultorioAsync(request);

        var request2 = new CadastroConsultorioRequest(
            "Clínica 2", "clinica@test.com", "22999999999", "outrasenha",
            null, null, null, null, null, null, null, null, null, null, null, null, null);

        var result = await _authService.CadastrarConsultorioAsync(request2);
        Assert.Null(result);
    }

    [Fact]
    public async Task CadastrarConsultorio_DeveAplicarDefaultsDeTema()
    {
        var request = new CadastroConsultorioRequest(
            "Clínica", "c@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);

        await _authService.CadastrarConsultorioAsync(request);
        var consultorio = await _context.Consultorios.FirstAsync(c => c.Email == "c@test.com");

        Assert.Equal("light", consultorio.Tema);
        Assert.Equal("#059669", consultorio.CorPrimaria);
        Assert.Equal("#10b981", consultorio.CorSecundaria);
        Assert.Equal("#f59e0b", consultorio.CorDestaque);
        Assert.Equal(2, consultorio.DiasAgenda);
        Assert.True(consultorio.Ativo);
    }

    // ── LoginAsync ──

    [Fact]
    public async Task LoginAsync_CredenciaisValidas_DeveRetornarLoginResponse()
    {
        var registerRequest = new CadastroConsultorioRequest(
            "Clínica", "login@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        await _authService.CadastrarConsultorioAsync(registerRequest);

        var loginRequest = new LoginRequest("login@test.com", "senha123");
        var result = await _authService.LoginAsync(loginRequest);

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result.Token));
        Assert.Equal("login@test.com", result.Email);
        Assert.Equal("Clínica", result.NomeFantasia);
        Assert.Equal("Admin", result.Perfil);
        Assert.Equal("light", result.Tema);
    }

    [Fact]
    public async Task LoginAsync_SenhaErrada_DeveRetornarNull()
    {
        var registerRequest = new CadastroConsultorioRequest(
            "Clínica", "login@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        await _authService.CadastrarConsultorioAsync(registerRequest);

        var loginRequest = new LoginRequest("login@test.com", "senhaerrada");
        var result = await _authService.LoginAsync(loginRequest);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_EmailInexistente_DeveRetornarNull()
    {
        var loginRequest = new LoginRequest("naoexiste@test.com", "senha123");
        var result = await _authService.LoginAsync(loginRequest);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_UsuarioInativo_DeveRetornarNull()
    {
        var registerRequest = new CadastroConsultorioRequest(
            "Clínica", "inativo@test.com", "11999999999", "senha123",
            null, null, null, null, null, null, null, null, null, null, null, null, null);
        await _authService.CadastrarConsultorioAsync(registerRequest);

        var usuario = await _context.Usuarios.FirstAsync(u => u.Email == "inativo@test.com");
        usuario.Ativo = false;
        await _context.SaveChangesAsync();

        var loginRequest = new LoginRequest("inativo@test.com", "senha123");
        var result = await _authService.LoginAsync(loginRequest);

        Assert.Null(result);
    }

    // ── CadastrarPacienteAsync ──

    [Fact]
    public async Task CadastrarPaciente_DeveCriarPaciente()
    {
        var consultorio = new Consultorio
        {
            NomeFantasia = "Clínica",
            Email = "c@test.com",
            TelefoneCelular = "11999999999"
        };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", null);
        var result = await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        Assert.NotNull(result);
        Assert.Equal("João", result.Nome);
        Assert.Equal("joao@test.com", result.Email);
    }

    [Fact]
    public async Task CadastrarPaciente_EmailDuplicadoMesmoConsultorio_DeveRetornarNull()
    {
        var consultorio = new Consultorio
        {
            NomeFantasia = "Clínica",
            Email = "c@test.com",
            TelefoneCelular = "11999999999"
        };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", null);
        await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        var request2 = new CadastroPacienteRequest("João Silva", "joao@test.com", "11977777777", null);
        var result = await _authService.CadastrarPacienteAsync(consultorio.Id, request2);

        Assert.Null(result);
    }

    [Fact]
    public async Task CadastrarPaciente_MesmoEmailConsultoriosDiferentes_DevePermitir()
    {
        var c1 = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        var c2 = new Consultorio { NomeFantasia = "C2", Email = "c2@test.com", TelefoneCelular = "22999999999" };
        _context.Consultorios.AddRange(c1, c2);
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", null);
        await _authService.CadastrarPacienteAsync(c1.Id, request);

        var request2 = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", null);
        var result = await _authService.CadastrarPacienteAsync(c2.Id, request2);

        Assert.NotNull(result);
    }

    // ── LoginPacienteAsync / cadastro com senha ──

    private async Task<Guid> CriarPacienteComSenhaAsync(string email, string senha)
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var paciente = new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João Paciente",
            Email = email,
            TelefoneCelular = "11988888888",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha)
        };
        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();
        return consultorio.Id;
    }

    [Fact]
    public async Task CadastrarPaciente_ComSenha_DeveCriarComSenhaHash()
    {
        var consultorio = new Consultorio { NomeFantasia = "Clínica", Email = "c@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", "senha123");
        var result = await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        Assert.NotNull(result);
        var paciente = await _context.Pacientes.FirstAsync(p => p.Id == result!.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("senha123", paciente.SenhaHash));
    }

    [Fact]
    public async Task CadastrarPaciente_PacienteSemSenha_DeveDefinirSenhaNoPrimeiroCadastro()
    {
        var consultorio = new Consultorio { NomeFantasia = "Clínica", Email = "c@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        _context.Pacientes.Add(new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João",
            Email = "joao@test.com",
            TelefoneCelular = "11988888888"
        });
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", "minhasenha");
        var result = await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        Assert.NotNull(result);
        var paciente = await _context.Pacientes.FirstAsync(p => p.Email == "joao@test.com");
        Assert.True(BCrypt.Net.BCrypt.Verify("minhasenha", paciente.SenhaHash));
    }

    [Fact]
    public async Task CadastrarPaciente_ContaGlobalComMesmoEmail_DeveVincularPaciente()
    {
        var consultorio = new Consultorio { NomeFantasia = "Clínica", Email = "c@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var conta = new ContaPaciente { Nome = "João", Email = "joao@test.com" };
        _context.ContasPacientes.Add(conta);
        await _context.SaveChangesAsync();

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888", null);
        var result = await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        Assert.NotNull(result);
        var paciente = await _context.Pacientes.FirstAsync(p => p.Email == "joao@test.com");
        Assert.Equal(conta.Id, paciente.ContaPacienteId);
    }

    [Fact]
    public async Task LoginPaciente_CredenciaisValidas_DeveRetornarTokenEDados()
    {
        var consultorioId = await CriarPacienteComSenhaAsync("paciente@test.com", "senha123");

        var request = new LoginPacienteRequest("paciente@test.com", "senha123");
        var result = await _authService.LoginPacienteAsync(consultorioId, request);

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.Token));
        Assert.Equal("João Paciente", result.Nome);
        Assert.Equal("paciente@test.com", result.Email);
        Assert.Equal("11988888888", result.TelefoneCelular);
        Assert.Equal(consultorioId, result.ConsultorioId);
    }

    [Fact]
    public async Task LoginPaciente_SenhaErrada_DeveRetornarNull()
    {
        var consultorioId = await CriarPacienteComSenhaAsync("paciente@test.com", "senha123");

        var request = new LoginPacienteRequest("paciente@test.com", "senhaerrada");
        var result = await _authService.LoginPacienteAsync(consultorioId, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginPaciente_PacienteSemSenhaCadastrada_DeveRetornarNull()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        _context.Pacientes.Add(new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João",
            Email = "paciente@test.com",
            TelefoneCelular = "11988888888"
        });
        await _context.SaveChangesAsync();

        var request = new LoginPacienteRequest("paciente@test.com", "senha123");
        var result = await _authService.LoginPacienteAsync(consultorio.Id, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginPaciente_EmailInexistente_DeveRetornarNull()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();

        var request = new LoginPacienteRequest("naoexiste@test.com", "senha123");
        var result = await _authService.LoginPacienteAsync(consultorio.Id, request);

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginPaciente_PacienteInativo_DeveRetornarNull()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        _context.Pacientes.Add(new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João",
            Email = "paciente@test.com",
            TelefoneCelular = "11988888888",
            SenhaHash = BCrypt.Net.BCrypt.HashPassword("senha123"),
            Ativo = false
        });
        await _context.SaveChangesAsync();

        var request = new LoginPacienteRequest("paciente@test.com", "senha123");
        var result = await _authService.LoginPacienteAsync(consultorio.Id, request);

        Assert.Null(result);
    }

    // ── LoginGoogleAsync ──

    [Fact]
    public async Task LoginGoogle_NovoPaciente_DeveCriarERetornarDados()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        _neonValidator.Resultado = new NeonUserInfo("google-123", "João Silva", "joao@gmail.com");

        var result = await _authService.LoginGoogleAsync(consultorio.Id, "sessao-opaca");

        Assert.NotNull(result);
        Assert.Equal("João Silva", result!.Nome);
        Assert.Equal("joao@gmail.com", result.Email);
        Assert.Null(result.TelefoneCelular);
        Assert.Equal(1, await _context.Pacientes.CountAsync(p => p.ConsultorioId == consultorio.Id));

        var paciente = await _context.Pacientes.FirstAsync(p => p.ConsultorioId == consultorio.Id);
        Assert.Equal("google-123", paciente.GoogleId);
    }

    [Fact]
    public async Task LoginGoogle_PacienteExistentePorGoogleId_DeveReutilizar()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        var paciente = new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João Silva",
            Email = "joao@gmail.com",
            TelefoneCelular = "11988888888",
            GoogleId = "google-123"
        };
        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();
        _neonValidator.Resultado = new NeonUserInfo("google-123", "João Silva", "joao@gmail.com");

        var result = await _authService.LoginGoogleAsync(consultorio.Id, "sessao-opaca");

        Assert.NotNull(result);
        Assert.Equal(paciente.Id, result!.Id);
        Assert.Equal("11988888888", result.TelefoneCelular);
        Assert.Equal(1, await _context.Pacientes.CountAsync());
    }

    [Fact]
    public async Task LoginGoogle_EmailJaCadastrado_DeveVincularGoogleId()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        var paciente = new Paciente
        {
            ConsultorioId = consultorio.Id,
            Nome = "João",
            Email = "joao@gmail.com",
            TelefoneCelular = "11988888888"
        };
        _context.Pacientes.Add(paciente);
        await _context.SaveChangesAsync();
        _neonValidator.Resultado = new NeonUserInfo("google-abc", "João Silva", "joao@gmail.com");

        var result = await _authService.LoginGoogleAsync(consultorio.Id, "sessao-opaca");

        Assert.NotNull(result);
        Assert.Equal(paciente.Id, result!.Id);
        var atualizado = await _context.Pacientes.FirstAsync(p => p.Id == paciente.Id);
        Assert.Equal("google-abc", atualizado.GoogleId);
        Assert.Equal(1, await _context.Pacientes.CountAsync());
    }

    [Fact]
    public async Task LoginGoogle_TokenInvalido_DeveRetornarNull()
    {
        var consultorio = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        _context.Consultorios.Add(consultorio);
        await _context.SaveChangesAsync();
        _neonValidator.Resultado = null;

        var result = await _authService.LoginGoogleAsync(consultorio.Id, "token-invalido");

        Assert.Null(result);
        Assert.Equal(0, await _context.Pacientes.CountAsync());
    }

    [Fact]
    public async Task LoginGoogle_EmailDeOutroConsultorio_DeveCriarNovoPaciente()
    {
        var c1 = new Consultorio { NomeFantasia = "C1", Email = "c1@test.com", TelefoneCelular = "11999999999" };
        var c2 = new Consultorio { NomeFantasia = "C2", Email = "c2@test.com", TelefoneCelular = "22999999999" };
        _context.Consultorios.AddRange(c1, c2);
        await _context.SaveChangesAsync();
        var pacienteOutro = new Paciente
        {
            ConsultorioId = c2.Id,
            Nome = "João",
            Email = "joao@gmail.com",
            TelefoneCelular = "11988888888"
        };
        _context.Pacientes.Add(pacienteOutro);
        await _context.SaveChangesAsync();
        _neonValidator.Resultado = new NeonUserInfo("google-123", "João Silva", "joao@gmail.com");

        var result = await _authService.LoginGoogleAsync(c1.Id, "sessao-opaca");

        Assert.NotNull(result);
        Assert.NotEqual(pacienteOutro.Id, result!.Id);
        Assert.Equal(2, await _context.Pacientes.CountAsync());
    }

    private sealed class FakeNeonValidator : INeonSessionValidator
    {
        public NeonUserInfo? Resultado { get; set; }

        public Task<NeonUserInfo?> ValidarSessionTokenAsync(string sessionToken)
            => Task.FromResult(Resultado);
    }
}
