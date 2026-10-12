using System.Text;
using System.Text.Json;
using Org.BouncyCastle.Crypto.Parameters;
using Org.BouncyCastle.Crypto.Signers;

namespace AgendaSaude.Api.Services;

public sealed record NeonJwtClaims(string UserId, string? Nome, string? Email);

/// <summary>
/// Validação do JWT EdDSA emitido pelo Neon Auth (plugin JWT do better-auth).
/// O SDK da Neon expõe o header set-auth-jwt via CORS e sobrescreve
/// session.token com esse JWT — aqui conferimos a assinatura contra a chave
/// pública registrada em neon_auth.jwks (mesma abordagem do Cardapio Online).
/// </summary>
public static class NeonJwt
{
    public static bool EhJwt(string token) => token.Split('.').Length == 3;

    public static string? LerKid(string jwt)
    {
        try
        {
            var partes = jwt.Split('.');
            if (partes.Length != 3) return null;

            using var header = JsonDocument.Parse(Base64UrlDecode(partes[0]));
            if (!header.RootElement.TryGetProperty("kid", out var kid)) return null;

            var valor = kid.GetString();
            return string.IsNullOrWhiteSpace(valor) ? null : valor;
        }
        catch
        {
            return null;
        }
    }

    public static NeonJwtClaims? Verificar(string jwt, string publicKeyJwkJson)
    {
        try
        {
            var partes = jwt.Split('.');
            if (partes.Length != 3) return null;

            using (var header = JsonDocument.Parse(Base64UrlDecode(partes[0])))
            {
                var alg = header.RootElement.TryGetProperty("alg", out var algEl) ? algEl.GetString() : null;
                if (!string.Equals(alg, "EdDSA", StringComparison.Ordinal)) return null;
            }

            var x = LerCoordenadaX(publicKeyJwkJson);
            if (x is null) return null;

            var assinatura = Base64UrlDecode(partes[2]);
            var mensagem = Encoding.ASCII.GetBytes($"{partes[0]}.{partes[1]}");

            var chave = new Ed25519PublicKeyParameters(x, 0);
            var verificador = new Ed25519Signer();
            verificador.Init(false, chave);
            verificador.BlockUpdate(mensagem, 0, mensagem.Length);
            if (!verificador.VerifySignature(assinatura)) return null;

            using var payload = JsonDocument.Parse(Base64UrlDecode(partes[1]));
            var raiz = payload.RootElement;

            if (!raiz.TryGetProperty("exp", out var expEl) || !expEl.TryGetInt64(out var exp)) return null;
            if (DateTimeOffset.UtcNow.ToUnixTimeSeconds() >= exp) return null;

            if (!raiz.TryGetProperty("sub", out var subEl)) return null;
            var sub = subEl.GetString();
            if (string.IsNullOrWhiteSpace(sub)) return null;

            var nome = raiz.TryGetProperty("name", out var nomeEl) ? nomeEl.GetString() : null;
            var email = raiz.TryGetProperty("email", out var emailEl) ? emailEl.GetString() : null;

            return new NeonJwtClaims(sub!, nome, email);
        }
        catch
        {
            return null;
        }
    }

    private static byte[]? LerCoordenadaX(string jwkJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(jwkJson);
            if (!doc.RootElement.TryGetProperty("x", out var xEl)) return null;

            var x = xEl.GetString();
            if (string.IsNullOrWhiteSpace(x)) return null;

            var bytes = Base64UrlDecode(x);
            return bytes.Length == 32 ? bytes : null;
        }
        catch
        {
            return null;
        }
    }

    private static byte[] Base64UrlDecode(string valor)
    {
        var normalizado = valor.Replace('-', '+').Replace('_', '/');
        normalizado = (normalizado.Length % 4) switch
        {
            2 => normalizado + "==",
            3 => normalizado + "=",
            _ => normalizado
        };
        return Convert.FromBase64String(normalizado);
    }
}
