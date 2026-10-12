using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class RefreshTokenService
{
    public static readonly TimeSpan Duracao = TimeSpan.FromDays(7);

    private readonly AppDbContext _context;

    public RefreshTokenService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<string> GerarAsync(Guid? consultorioId, Guid? usuarioId, Guid? pacienteId, Guid? contaPacienteId = null)
    {
        var raw = GerarToken();

        _context.RefreshTokens.Add(new RefreshToken
        {
            TokenHash = Hash(raw),
            ConsultorioId = consultorioId,
            UsuarioId = usuarioId,
            PacienteId = pacienteId,
            ContaPacienteId = contaPacienteId,
            ExpiraEm = DateTime.UtcNow.Add(Duracao)
        });

        await _context.SaveChangesAsync();
        return raw;
    }

    public async Task<RefreshToken?> ValidarAsync(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return null;

        var hash = Hash(raw);
        var agora = DateTime.UtcNow;

        return await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Revogado && t.ExpiraEm > agora);
    }

    public async Task RevogarAsync(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return;

        var hash = Hash(raw);
        var token = await _context.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Revogado);

        if (token is not null)
        {
            token.Revogado = true;
            await _context.SaveChangesAsync();
        }
    }

    public async Task RevogarTodosDoUsuarioAsync(Guid usuarioId)
    {
        var tokens = await _context.RefreshTokens
            .Where(t => t.UsuarioId == usuarioId && !t.Revogado)
            .ToListAsync();

        foreach (var t in tokens) t.Revogado = true;
        if (tokens.Count > 0) await _context.SaveChangesAsync();
    }

    private static string GerarToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64))
            .Replace("+", "-").Replace("/", "_").TrimEnd('=');

    private static string Hash(string raw)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(raw)));
}
