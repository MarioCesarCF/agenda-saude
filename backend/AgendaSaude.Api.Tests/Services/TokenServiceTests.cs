using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Tests.Services;

public class TokenServiceTests
{
    private const string TestKey = "super-secret-test-key-that-is-long-enough-for-hmac-sha256";
    private const string TestIssuer = "TestIssuer";
    private const string TestAudience = "TestAudience";

    private readonly TokenService _service = new(TestKey, TestIssuer, TestAudience);

    [Fact]
    public void GerarToken_DeveRetornarTokenNaoVazio()
    {
        var token = _service.GerarToken(Guid.NewGuid(), "test@email.com", "Test User", "Admin", Guid.NewGuid());
        Assert.False(string.IsNullOrWhiteSpace(token));
    }

    [Fact]
    public void GerarToken_TokenDeveSerValido()
    {
        var token = _service.GerarToken(Guid.NewGuid(), "test@email.com", "Test User", "Admin", Guid.NewGuid());
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(TestIssuer, jwt.Issuer);
        Assert.Equal(TestAudience, jwt.Audiences.First());
    }

    [Fact]
    public void GerarToken_DeveConterClaimsCorretas()
    {
        var userId = Guid.NewGuid();
        var consultorioId = Guid.NewGuid();
        var token = _service.GerarToken(userId, "test@email.com", "Test User", "Admin", consultorioId);
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(userId.ToString(), jwt.Claims.First(c => c.Type == ClaimTypes.NameIdentifier).Value);
        Assert.Equal("test@email.com", jwt.Claims.First(c => c.Type == ClaimTypes.Email).Value);
        Assert.Equal("Test User", jwt.Claims.First(c => c.Type == ClaimTypes.Name).Value);
        Assert.Equal("Admin", jwt.Claims.First(c => c.Type == ClaimTypes.Role).Value);
        Assert.Equal(consultorioId.ToString(), jwt.Claims.First(c => c.Type == "ConsultorioId").Value);
    }

    [Fact]
    public void GerarToken_DeveExpirarEm4Horas()
    {
        var token = _service.GerarToken(Guid.NewGuid(), "test@email.com", "Test User", "Admin", Guid.NewGuid());
        var handler = new JwtSecurityTokenHandler();
        var jwt = handler.ReadJwtToken(token);

        var horasRestantes = (jwt.ValidTo - DateTime.UtcNow).TotalHours;
        Assert.InRange(horasRestantes, 3.9, 4.1);
    }

    [Fact]
    public void GerarToken_DiferentesChavesDevemGerarTokensDiferentes()
    {
        var service2 = new TokenService("outra-chave-diferente-tambem-bastante-longa", TestIssuer, TestAudience);
        var token1 = _service.GerarToken(Guid.NewGuid(), "a@email.com", "A", "Admin", Guid.NewGuid());
        var token2 = service2.GerarToken(Guid.NewGuid(), "a@email.com", "A", "Admin", Guid.NewGuid());

        Assert.NotEqual(token1, token2);
    }
}
