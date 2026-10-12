using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;

namespace AgendaSaude.Api.Services;

public class ConsultorioResolver
{
    private readonly AppDbContext _context;

    public ConsultorioResolver(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Guid?> ResolverIdAsync(string slugOuId)
    {
        if (string.IsNullOrWhiteSpace(slugOuId)) return null;

        if (Guid.TryParse(slugOuId, out var id))
        {
            return await _context.Consultorios
                .Where(c => c.Id == id && c.Ativo)
                .Select(c => (Guid?)c.Id)
                .FirstOrDefaultAsync();
        }

        var slug = slugOuId.Trim().ToLowerInvariant();
        return await _context.Consultorios
            .Where(c => c.Slug == slug && c.Ativo)
            .Select(c => (Guid?)c.Id)
            .FirstOrDefaultAsync();
    }
}
