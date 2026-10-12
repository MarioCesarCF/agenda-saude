using AgendaSaude.Api.Data;
using AgendaSaude.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgendaSaude.Api.Tests.Services;

public class RefreshTokenServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly RefreshTokenService _service;

    public RefreshTokenServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _service = new RefreshTokenService(_context);
    }

    public void Dispose() => _context.Dispose();

    [Fact]
    public async Task GerarAsync_DeveRetornarTokenE_PersistirHash()
    {
        var consultorioId = Guid.NewGuid();
        var usuarioId = Guid.NewGuid();

        var raw = await _service.GerarAsync(consultorioId, usuarioId, null);

        Assert.False(string.IsNullOrWhiteSpace(raw));
        var stored = await _context.RefreshTokens.SingleAsync();
        Assert.NotEqual(raw, stored.TokenHash);
        Assert.Equal(usuarioId, stored.UsuarioId);
        Assert.Null(stored.PacienteId);
        Assert.False(stored.Revogado);
        Assert.True(stored.ExpiraEm > DateTime.UtcNow.AddDays(6));
    }

    [Fact]
    public async Task ValidarAsync_TokenValido_DeveRetornarRegistro()
    {
        var raw = await _service.GerarAsync(Guid.NewGuid(), Guid.NewGuid(), null);

        var stored = await _service.ValidarAsync(raw);

        Assert.NotNull(stored);
    }

    [Fact]
    public async Task ValidarAsync_TokenInexistente_DeveRetornarNull()
    {
        Assert.Null(await _service.ValidarAsync("token-inexistente"));
        Assert.Null(await _service.ValidarAsync(null));
    }

    [Fact]
    public async Task RevogarAsync_DeveInvalidarToken()
    {
        var raw = await _service.GerarAsync(Guid.NewGuid(), Guid.NewGuid(), null);

        await _service.RevogarAsync(raw);

        Assert.Null(await _service.ValidarAsync(raw));
    }

    [Fact]
    public async Task ValidarAsync_TokenExpirado_DeveRetornarNull()
    {
        var raw = await _service.GerarAsync(Guid.NewGuid(), Guid.NewGuid(), null);
        var stored = await _context.RefreshTokens.SingleAsync();
        stored.ExpiraEm = DateTime.UtcNow.AddMinutes(-1);
        await _context.SaveChangesAsync();

        Assert.Null(await _service.ValidarAsync(raw));
    }

    [Fact]
    public async Task RevogarTodosDoUsuarioAsync_DeveRevogarSomenteDoUsuario()
    {
        var usuarioId = Guid.NewGuid();
        var outroId = Guid.NewGuid();
        await _service.GerarAsync(Guid.NewGuid(), usuarioId, null);
        await _service.GerarAsync(Guid.NewGuid(), usuarioId, null);
        await _service.GerarAsync(Guid.NewGuid(), outroId, null);

        await _service.RevogarTodosDoUsuarioAsync(usuarioId);

        var ativos = await _context.RefreshTokens.Where(t => !t.Revogado).ToListAsync();
        Assert.Single(ativos);
        Assert.Equal(outroId, ativos[0].UsuarioId);
    }
}
