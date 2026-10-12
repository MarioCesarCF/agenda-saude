using System.Text;
using AgendaSaude.Api.Services;
using Org.BouncyCastle.Crypto.Generators;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;
using Org.BouncyCastle.Security;

namespace AgendaSaude.Api.Tests.Services;

public class NeonJwtTests
{
    private readonly Ed25519PrivateKeyParameters _privada;
    private readonly string _jwkPublico;

    public NeonJwtTests()
    {
        var gerador = new Ed25519KeyPairGenerator();
        gerador.Init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        var par = gerador.GenerateKeyPair();
        _privada = (Ed25519PrivateKeyParameters)par.Private;
        var publica = (Ed25519PublicKeyParameters)par.Public;
        _jwkPublico = $"{{\"kty\":\"OKP\",\"crv\":\"Ed25519\",\"x\":\"{Base64Url(publica.GetEncoded())}\"}}";
    }

    private string MontarJwt(string payloadJson, string alg = "EdDSA", string kid = "kid-1", Ed25519PrivateKeyParameters? chave = null)
    {
        var header = Base64Url(Encoding.UTF8.GetBytes($"{{\"alg\":\"{alg}\",\"kid\":\"{kid}\"}}"));
        var payload = Base64Url(Encoding.UTF8.GetBytes(payloadJson));
        var assinaturaInput = $"{header}.{payload}";

        var signer = new Ed25519Signer();
        signer.Init(true, chave ?? _privada);
        var bytes = Encoding.ASCII.GetBytes(assinaturaInput);
        signer.BlockUpdate(bytes, 0, bytes.Length);
        return $"{assinaturaInput}.{Base64Url(signer.GenerateSignature())}";
    }

    [Fact]
    public void EhJwt_TresPartes_RetornaVerdadeiro()
    {
        Assert.True(NeonJwt.EhJwt("a.b.c"));
    }

    [Fact]
    public void EhJwt_TokenOpaco_RetornaFalso()
    {
        Assert.False(NeonJwt.EhJwt("token-opaco-sem-pontos"));
    }

    [Fact]
    public void LerKid_RetornaKidDoHeader()
    {
        var jwt = MontarJwt(PayloadValido(), kid: "abc-123");
        Assert.Equal("abc-123", NeonJwt.LerKid(jwt));
    }

    [Fact]
    public void Verificar_JwtValido_RetornaClaims()
    {
        var sub = Guid.NewGuid().ToString();
        var jwt = MontarJwt(PayloadValido(sub: sub, nome: "João", email: "joao@x.com"));

        var claims = NeonJwt.Verificar(jwt, _jwkPublico);

        Assert.NotNull(claims);
        Assert.Equal(sub, claims!.UserId);
        Assert.Equal("João", claims.Nome);
        Assert.Equal("joao@x.com", claims.Email);
    }

    [Fact]
    public void Verificar_AssinaturaAdulterada_RetornaNulo()
    {
        var jwt = MontarJwt(PayloadValido());
        var partes = jwt.Split('.');
        var jwtAdulterado = $"{partes[0]}.{partes[1]}.{Base64Url(new byte[64])}";

        Assert.Null(NeonJwt.Verificar(jwtAdulterado, _jwkPublico));
    }

    [Fact]
    public void Verificar_ChaveDiferente_RetornaNulo()
    {
        var gerador = new Ed25519KeyPairGenerator();
        gerador.Init(new Ed25519KeyGenerationParameters(new SecureRandom()));
        var outra = (Ed25519PrivateKeyParameters)gerador.GenerateKeyPair().Private;

        var jwt = MontarJwt(PayloadValido(), chave: outra);

        Assert.Null(NeonJwt.Verificar(jwt, _jwkPublico));
    }

    [Fact]
    public void Verificar_Expirado_RetornaNulo()
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(-5).ToUnixTimeSeconds();
        var jwt = MontarJwt($"{{\"sub\":\"{Guid.NewGuid()}\",\"email\":\"a@b.com\",\"exp\":{exp}}}");

        Assert.Null(NeonJwt.Verificar(jwt, _jwkPublico));
    }

    [Fact]
    public void Verificar_AlgNaoEdDsa_RetornaNulo()
    {
        var jwt = MontarJwt(PayloadValido(), alg: "HS256");

        Assert.Null(NeonJwt.Verificar(jwt, _jwkPublico));
    }

    [Fact]
    public void Verificar_SemSubject_RetornaNulo()
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds();
        var jwt = MontarJwt($"{{\"email\":\"a@b.com\",\"exp\":{exp}}}");

        Assert.Null(NeonJwt.Verificar(jwt, _jwkPublico));
    }

    private static string PayloadValido(string? sub = null, string nome = "Fulano", string email = "fulano@x.com")
    {
        var exp = DateTimeOffset.UtcNow.AddMinutes(5).ToUnixTimeSeconds();
        return $"{{\"sub\":\"{sub ?? Guid.NewGuid().ToString()}\",\"name\":\"{nome}\",\"email\":\"{email}\",\"exp\":{exp}}}";
    }

    private static string Base64Url(byte[] dados)
        => Convert.ToBase64String(dados).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
