using AgendaSaude.Api.Data;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;

namespace AgendaSaude.Api.Tests.Services;

public class ConsultorioResolverTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly ConsultorioResolver _resolver;

    public ConsultorioResolverTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _resolver = new ConsultorioResolver(_context);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Consultorio> CriarConsultorio(string slug, bool ativo = true)
    {
        var c = new Consultorio
        {
            NomeFantasia = "Clínica Teste",
            Slug = slug,
            Email = $"{slug}@test.com",
            TelefoneCelular = "11999999999",
            Ativo = ativo
        };
        _context.Consultorios.Add(c);
        await _context.SaveChangesAsync();
        return c;
    }

    [Fact]
    public async Task ResolverIdAsync_PorSlug_DeveRetornarId()
    {
        var c = await CriarConsultorio("clinica-teste");

        var id = await _resolver.ResolverIdAsync("clinica-teste");

        Assert.Equal(c.Id, id);
    }

    [Fact]
    public async Task ResolverIdAsync_PorGuid_DeveRetornarId()
    {
        var c = await CriarConsultorio("clinica-teste");

        var id = await _resolver.ResolverIdAsync(c.Id.ToString());

        Assert.Equal(c.Id, id);
    }

    [Fact]
    public async Task ResolverIdAsync_SlugInexistente_DeveRetornarNull()
    {
        Assert.Null(await _resolver.ResolverIdAsync("nao-existe"));
    }

    [Fact]
    public async Task ResolverIdAsync_ConsultorioInativo_DeveRetornarNull()
    {
        await CriarConsultorio("inativo", ativo: false);

        Assert.Null(await _resolver.ResolverIdAsync("inativo"));
    }
}
