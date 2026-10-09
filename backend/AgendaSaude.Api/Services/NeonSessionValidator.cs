using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;

namespace AgendaSaude.Api.Services;

/// <summary>
/// Valida o token de sessão opaco do Neon Auth resolvendo-o nas tabelas
/// neon_auth.session / neon_auth."user" (mesma abordagem do Cardapio Online).
/// No navegador o SDK do Neon não expõe o JWT (cookie HttpOnly + CORS), então o
/// token retornado por getSession() é o token opaco — este validador confere
/// existência e validade da sessão e devolve os dados do usuário logado via Google.
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

    private sealed class NeonSessionRow
    {
        public Guid Id { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public bool Banned { get; set; }
    }
}