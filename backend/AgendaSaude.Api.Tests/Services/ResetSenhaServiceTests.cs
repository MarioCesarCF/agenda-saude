using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Tests.Services;

public class ResetSenhaServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly FakeEmailSender _emailSender = new();
    private readonly ResetSenhaService _service;

    public ResetSenhaServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _service = new ResetSenhaService(_context, _emailSender, NullLogger<ResetSenhaService>.Instance);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Usuario> CriarUsuarioAsync(string email = "admin@test.com", string senha = "senhaAntiga")
    {
        var consultorio = new Consultorio
        {
            NomeFantasia = "Clinica Teste",
            Email = "clinica@test.com",
            TelefoneCelular = "11999999999"
        };
        _context.Consultorios.Add(consultorio);

        var usuario = new Usuario
        {
            ConsultorioId = consultorio.Id,
            Nome = "Admin",
            Email = email,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(senha)
        };
        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }

    [Fact]
    public async Task SolicitarReset_EmailExistente_CriaTokenEEnviaEmail()
    {
        await CriarUsuarioAsync();

        await _service.SolicitarResetAsync("admin@test.com");

        Assert.Equal(1, await _context.ResetTokens.CountAsync());
        Assert.NotNull(_emailSender.UltimoCorpo);
        Assert.Matches(@"\d{6}", _emailSender.UltimoCorpo!);
    }

    [Fact]
    public async Task SolicitarReset_EmailInexistente_NaoCriaTokenEnaoEnvia()
    {
        await _service.SolicitarResetAsync("naoexiste@test.com");

        Assert.Equal(0, await _context.ResetTokens.CountAsync());
        Assert.Null(_emailSender.UltimoCorpo);
    }

    [Fact]
    public async Task SolicitarReset_InvalidaTokensAnteriores()
    {
        var usuario = await CriarUsuarioAsync();

        await _service.SolicitarResetAsync(usuario.Email);
        await _service.SolicitarResetAsync(usuario.Email);

        Assert.Equal(2, await _context.ResetTokens.CountAsync());
        Assert.Equal(1, await _context.ResetTokens.CountAsync(t => !t.Usado));
    }

    [Fact]
    public async Task ResetarSenha_CodigoValido_AtualizaSenha()
    {
        var usuario = await CriarUsuarioAsync();
        await _service.SolicitarResetAsync(usuario.Email);
        var codigo = ExtrairCodigo(_emailSender.UltimoCorpo!);

        var ok = await _service.ResetarSenhaAsync(codigo, "novaSenha123");

        Assert.True(ok);
        var atualizado = await _context.Usuarios.FirstAsync(u => u.Id == usuario.Id);
        Assert.True(BCrypt.Net.BCrypt.Verify("novaSenha123", atualizado.SenhaHash));
    }

    [Fact]
    public async Task ResetarSenha_CodigoInvalido_RetornaFalse()
    {
        await CriarUsuarioAsync();
        await _service.SolicitarResetAsync("admin@test.com");

        var ok = await _service.ResetarSenhaAsync("000000", "novaSenha123");

        Assert.False(ok);
    }

    [Fact]
    public async Task ResetarSenha_MesmoCodigoDuasVezes_SegundaFalha()
    {
        var usuario = await CriarUsuarioAsync();
        await _service.SolicitarResetAsync(usuario.Email);
        var codigo = ExtrairCodigo(_emailSender.UltimoCorpo!);

        var primeira = await _service.ResetarSenhaAsync(codigo, "novaSenha123");
        var segunda = await _service.ResetarSenhaAsync(codigo, "outraSenha456");

        Assert.True(primeira);
        Assert.False(segunda);
    }

    [Fact]
    public async Task ResetarSenha_CodigoExpirado_RetornaFalse()
    {
        var usuario = await CriarUsuarioAsync();
        await _service.SolicitarResetAsync(usuario.Email);
        var codigo = ExtrairCodigo(_emailSender.UltimoCorpo!);

        var token = await _context.ResetTokens.FirstAsync();
        token.ExpiraEm = DateTime.UtcNow.AddMinutes(-1);
        await _context.SaveChangesAsync();

        var ok = await _service.ResetarSenhaAsync(codigo, "novaSenha123");

        Assert.False(ok);
    }

    private static string ExtrairCodigo(string corpo)
    {
        var match = Regex.Match(corpo, @">(\d{6})<");
        return match.Groups[1].Value;
    }

    private sealed class FakeEmailSender : IEmailSender
    {
        public string? UltimoCorpo { get; private set; }

        public Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
        {
            UltimoCorpo = corpoHtml;
            return Task.CompletedTask;
        }
    }
}
