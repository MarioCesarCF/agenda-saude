using AgendaSaude.Api.Data;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgendaSaude.Api.Tests.Services;

public class CadastroServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly CadastroService _service;

    public CadastroServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _service = new CadastroService(_context);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Consultorio> CriarConsultorioPadrao()
    {
        var c = new Consultorio
        {
            NomeFantasia = "Clínica",
            Email = "clinica@test.com",
            TelefoneCelular = "11999999999"
        };
        _context.Consultorios.Add(c);
        await _context.SaveChangesAsync();
        return c;
    }

    // ── CriarOuBuscarPacienteAsync ──

    [Fact]
    public async Task CriarOuBuscarPaciente_NovoPaciente_DeveCriar()
    {
        var c = await CriarConsultorioPadrao();
        var result = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", "joao@test.com", "11988888888");

        Assert.Equal("João", result.Nome);
        Assert.Equal("joao@test.com", result.Email);
        Assert.NotEqual(Guid.Empty, result.Id);

        var count = await _context.Pacientes.CountAsync(p => p.ConsultorioId == c.Id);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task CriarOuBuscarPaciente_MesmoEmail_DeveRetornarExistente()
    {
        var c = await CriarConsultorioPadrao();
        var r1 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", "joao@test.com", "11988888888");
        var r2 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João Silva", "joao@test.com", "11977777777");

        Assert.Equal(r1.Id, r2.Id);
        var count = await _context.Pacientes.CountAsync(p => p.ConsultorioId == c.Id);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task CriarOuBuscarPaciente_SemEmail_MesmoNomeTelefone_DeveRetornarExistente()
    {
        var c = await CriarConsultorioPadrao();
        var r1 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", null, "11988888888");
        var r2 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", null, "11988888888");

        Assert.Equal(r1.Id, r2.Id);
        var count = await _context.Pacientes.CountAsync(p => p.ConsultorioId == c.Id);
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task CriarOuBuscarPaciente_SemEmail_DiferenteNomeOuTelefone_DeveCriarNovo()
    {
        var c = await CriarConsultorioPadrao();
        var r1 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", null, "11988888888");
        var r2 = await _service.CriarOuBuscarPacienteAsync(c.Id, "Maria", null, "11977777777");

        Assert.NotEqual(r1.Id, r2.Id);
        var count = await _context.Pacientes.CountAsync(p => p.ConsultorioId == c.Id);
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task CriarOuBuscarPaciente_ComEmail_BuscaPorEmailPrimeiro()
    {
        var c = await CriarConsultorioPadrao();
        var r1 = await _service.CriarOuBuscarPacienteAsync(c.Id, "João", "joao@test.com", "11988888888");
        var r2 = await _service.CriarOuBuscarPacienteAsync(c.Id, "Outro Nome", "joao@test.com", "99999999999");

        Assert.Equal(r1.Id, r2.Id);
    }

    [Fact]
    public async Task CriarOuBuscarPaciente_OutroConsultorio_MesmoEmail_DeveCriarNovo()
    {
        var c1 = await CriarConsultorioPadrao();
        var c2 = new Consultorio
        {
            NomeFantasia = "C2",
            Email = "c2@test.com",
            TelefoneCelular = "22999999999"
        };
        _context.Consultorios.Add(c2);
        await _context.SaveChangesAsync();

        var r1 = await _service.CriarOuBuscarPacienteAsync(c1.Id, "João", "joao@test.com", "11988888888");
        var r2 = await _service.CriarOuBuscarPacienteAsync(c2.Id, "João", "joao@test.com", "11988888888");

        Assert.NotEqual(r1.Id, r2.Id);
    }

    // ── CriarProfissionalAsync ──

    [Fact]
    public async Task CriarProfissional_DeveCriarComDadosCorretos()
    {
        var c = await CriarConsultorioPadrao();
        var request = new ProfissionalRequest("Dr. Silva", "11988888888", "dr@test.com", "Cardiologia", "CRM-123");

        var result = await _service.CriarProfissionalAsync(c.Id, request);

        Assert.Equal("Dr. Silva", result.Nome);
        Assert.Equal("Cardiologia", result.Especialidade);
        Assert.Equal("CRM-123", result.RegistroProfissional);
        Assert.True(result.Ativo);
    }

    // ── CriarServicoAsync ──

    [Fact]
    public async Task CriarServico_DeveCriarComDadosCorretos()
    {
        var c = await CriarConsultorioPadrao();
        var request = new ServicoRequest("Consulta", "Consulta geral", 30, 150.00m, null, false);

        var result = await _service.CriarServicoAsync(c.Id, request);

        Assert.Equal("Consulta", result.Nome);
        Assert.Equal(30, result.DuracaoMinutos);
        Assert.Equal(150.00m, result.Preco);
        Assert.False(result.SemProfissional);
    }

    // ── ListarProfissionaisAsync ──

    [Fact]
    public async Task ListarProfissionais_DeveRetornarApenasDoConsultorio()
    {
        var c1 = await CriarConsultorioPadrao();
        var c2 = new Consultorio
        {
            NomeFantasia = "C2",
            Email = "c2@test.com",
            TelefoneCelular = "22999999999"
        };
        _context.Consultorios.Add(c2);
        await _context.SaveChangesAsync();

        await _service.CriarProfissionalAsync(c1.Id, new ProfissionalRequest("Dr. Silva", null, null, null, null));
        await _service.CriarProfissionalAsync(c2.Id, new ProfissionalRequest("Dr. Souza", null, null, null, null));

        var result = await _service.ListarProfissionaisAsync(c1.Id);
        Assert.Single(result);
        Assert.Equal("Dr. Silva", result[0].Nome);
    }

    // ── ListarServicosAsync ──

    [Fact]
    public async Task ListarServicos_ComFiltroProfissional_DeveRetornarApenasVinculados()
    {
        var c = await CriarConsultorioPadrao();
        var prof = await _service.CriarProfissionalAsync(c.Id, new ProfissionalRequest("Dr. Silva", null, null, null, null));
        var s1 = await _service.CriarServicoAsync(c.Id, new ServicoRequest("Consulta", null, 30, 100, null, false));
        var s2 = await _service.CriarServicoAsync(c.Id, new ServicoRequest("Exame", null, 60, 200, null, true));

        await _service.VincularServicoAsync(prof.Id, s1.Id);

        var result = await _service.ListarServicosAsync(c.Id, prof.Id);
        Assert.Single(result);
        Assert.Equal("Consulta", result[0].Nome);
    }

    private async Task VincularServicoAsync(Guid profissionalId, Guid servicoId)
    {
        _context.ProfissionaisServicos.Add(new ProfissionalServico
        {
            ProfissionalId = profissionalId,
            ServicoId = servicoId
        });
        await _context.SaveChangesAsync();
    }
}
