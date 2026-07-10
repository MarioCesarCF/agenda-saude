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
    private const string JwtKey = "test-key-for-auth-service-tests-32-chars-min";

    public AuthServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _tokenService = new TokenService(JwtKey, "Test", "Test");
        _authService = new AuthService(_context, _tokenService);
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

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888");
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

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888");
        await _authService.CadastrarPacienteAsync(consultorio.Id, request);

        var request2 = new CadastroPacienteRequest("João Silva", "joao@test.com", "11977777777");
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

        var request = new CadastroPacienteRequest("João", "joao@test.com", "11988888888");
        await _authService.CadastrarPacienteAsync(c1.Id, request);

        var request2 = new CadastroPacienteRequest("João", "joao@test.com", "11988888888");
        var result = await _authService.CadastrarPacienteAsync(c2.Id, request2);

        Assert.NotNull(result);
    }
}
