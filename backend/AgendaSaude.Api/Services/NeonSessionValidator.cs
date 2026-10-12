using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;

namespace AgendaSaude.Api.Services;

/// <summary>
/// Valida o token devolvido pelo Neon Auth. No navegador o SDK sobrescreve
/// session.token com o JWT EdDSA (header set-auth-jwt exposto via CORS), então o
/// caminho principal confere a assinatura contra neon_auth.jwks e os dados do
/// usuário em neon_auth."user". Se vier o token opaco do cookie HttpOnly,
/// resolvemos em neon_auth.session (mesma abordagem do Cardapio Online).
/// </summary>
public class NeonSessionValidator : INeonSessionValidator
{
    private readonly AppDbContext _context;

    public NeonSessionValidator(AppDbContext context)
    {
        _context = context;
    }

    public async Task<NeonUserInfo?> ValidarSessionTokenAsync(string sessionToken)
    {
        var token = sessionToken?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(token))
            return null;

        if (NeonJwt.EhJwt(token))
            return await ValidarJwtAsync(token);

        return await ValidarTokenOpacoAsync(token);
    }

    private async Task<NeonUserInfo?> ValidarJwtAsync(string jwt)
    {
        try
        {
            var kid = NeonJwt.LerKid(jwt);
            if (string.IsNullOrWhiteSpace(kid))
                return null;

            var jwkJson = (await _context.Database.SqlQueryRaw<JwksRow>(
                "SELECT \"publicKey\" AS \"PublicKey\" FROM neon_auth.jwks WHERE id = {0}::uuid LIMIT 1",
                kid).ToListAsync()).FirstOrDefault()?.PublicKey;

            if (string.IsNullOrWhiteSpace(jwkJson))
                return null;

            var claims = NeonJwt.Verificar(jwt, jwkJson);
            if (claims is null)
                return null;

            var usuario = (await _context.Database.SqlQueryRaw<NeonSessionRow>(
                """
                SELECT u."id", u.email, u."name", u.banned
                FROM neon_auth."user" u
                WHERE u."id" = {0}::uuid
                LIMIT 1
                """,
                claims.UserId).ToListAsync()).FirstOrDefault();

            if (usuario is null || usuario.Banned)
                return null;

            var email = string.IsNullOrWhiteSpace(usuario.Email) ? claims.Email : usuario.Email;
            if (string.IsNullOrWhiteSpace(email))
                return null;

            var nome = string.IsNullOrWhiteSpace(usuario.Name)
                ? (string.IsNullOrWhiteSpace(claims.Nome) ? "Paciente Google" : claims.Nome!)
                : usuario.Name!;

            return new NeonUserInfo(claims.UserId, nome, email!);
        }
        catch
        {
            return null;
        }
    }

    private async Task<NeonUserInfo?> ValidarTokenOpacoAsync(string token)
    {
        var row = (await _context.Database.SqlQueryRaw<NeonSessionRow>(
            """
            SELECT u."id", u.email, u."name", u.banned
            FROM neon_auth.session s
            JOIN neon_auth."user" u ON u."id" = s."userId"
            WHERE (s.token = {0} OR s.token LIKE {0} || '.%')
              AND s."expiresAt" > NOW()
            LIMIT 1
            """,
            token).ToListAsync()).FirstOrDefault();

        if (row is null || row.Banned || string.IsNullOrWhiteSpace(row.Email))
            return null;

        var nome = string.IsNullOrWhiteSpace(row.Name) ? "Paciente Google" : row.Name!;
        return new NeonUserInfo(row.Id.ToString(), nome, row.Email);
    }

    private sealed class JwksRow
    {
        public string PublicKey { get; set; } = string.Empty;
    }

    private sealed class NeonSessionRow
    {
        public Guid Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public bool Banned { get; set; }
    }
}
