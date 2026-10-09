using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;
using AgendaSaude.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace AgendaSaude.Api.Tests.Services;

public class AgendamentoServiceTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly AgendamentoService _service;

    public AgendamentoServiceTests()
    {
        _context = TestHelper.CreateInMemoryContext();
        _service = new AgendamentoService(_context);
    }

    public void Dispose() => _context.Dispose();

    private async Task<Consultorio> CriarConsultorioAsync(string nome)
    {
        var c = new Consultorio
        {
            NomeFantasia = nome,
            Email = $"{nome.ToLower().Replace(" ", "")}@test.com",
            TelefoneCelular = "11999999999"
        };
        _context.Consultorios.Add(c);
        await _context.SaveChangesAsync();
        return c;
    }

    private async Task<Profissional> CriarProfissionalAsync(Guid consultorioId, string nome)
    {
        var p = new Profissional
        {
            ConsultorioId = consultorioId,
            Nome = nome,
            TelefoneCelular = "11999999999"
        };
        _context.Profissionais.Add(p);
        await _context.SaveChangesAsync();
        return p;
    }

    private async Task<Servico> CriarServicoAsync(Guid consultorioId, bool semProfissional = false)
    {
        var s = new Servico
        {
            ConsultorioId = consultorioId,
            Nome = "Consulta",
            DuracaoMinutos = 30,
            Preco = 100m,
            SemProfissional = semProfissional
        };
        _context.Servicos.Add(s);
        await _context.SaveChangesAsync();
        return s;
    }

    private async Task<Paciente> CriarPacienteAsync(Guid consultorioId, string nome)
    {
        var p = new Paciente
        {
            ConsultorioId = consultorioId,
            Nome = nome,
            TelefoneCelular = "11988888888"
        };
        _context.Pacientes.Add(p);
        await _context.SaveChangesAsync();
        return p;
    }

    [Fact]
    public async Task CriarAgendamento_Valido_DeveCriar()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var prof = await CriarProfissionalAsync(c.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");

        var inicio = DateTime.UtcNow.Date.AddDays(2).AddHours(10);
        var result = await _service.CriarAgendamentoAsync(
            c.Id, paciente.Id, new AgendamentoRequest(prof.Id, servico.Id, inicio));

        Assert.NotNull(result);
        Assert.Equal(prof.Id, result!.ProfissionalId);
        Assert.Equal(inicio.AddMinutes(30), result.DataHoraFim);
    }

    [Fact]
    public async Task CriarAgendamento_ProfissionalDeOutroConsultorio_DeveRetornarNull()
    {
        var c1 = await CriarConsultorioAsync("Clinica A");
        var c2 = await CriarConsultorioAsync("Clinica B");
        var profOutro = await CriarProfissionalAsync(c2.Id, "Dr. Externo");
        var servico = await CriarServicoAsync(c1.Id);
        var paciente = await CriarPacienteAsync(c1.Id, "João");

        var inicio = DateTime.UtcNow.Date.AddDays(2).AddHours(10);
        var result = await _service.CriarAgendamentoAsync(
            c1.Id, paciente.Id, new AgendamentoRequest(profOutro.Id, servico.Id, inicio));

        Assert.Null(result);
    }

    [Fact]
    public async Task CriarAgendamento_PacienteDeOutroConsultorio_DeveRetornarNull()
    {
        var c1 = await CriarConsultorioAsync("Clinica A");
        var c2 = await CriarConsultorioAsync("Clinica B");
        var prof = await CriarProfissionalAsync(c1.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c1.Id);
        var pacienteOutro = await CriarPacienteAsync(c2.Id, "Paciente Externo");

        var inicio = DateTime.UtcNow.Date.AddDays(2).AddHours(10);
        var result = await _service.CriarAgendamentoAsync(
            c1.Id, pacienteOutro.Id, new AgendamentoRequest(prof.Id, servico.Id, inicio));

        Assert.Null(result);
    }

    [Fact]
    public async Task CriarAgendamento_DataNoPassado_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var prof = await CriarProfissionalAsync(c.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");

        var inicio = DateTime.UtcNow.AddDays(-1);
        var result = await _service.CriarAgendamentoAsync(
            c.Id, paciente.Id, new AgendamentoRequest(prof.Id, servico.Id, inicio));

        Assert.Null(result);
    }

    [Fact]
    public async Task CriarAgendamento_ConflitoDeHorario_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var prof = await CriarProfissionalAsync(c.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");

        var inicio = DateTime.UtcNow.Date.AddDays(2).AddHours(10);
        var primeiro = await _service.CriarAgendamentoAsync(
            c.Id, paciente.Id, new AgendamentoRequest(prof.Id, servico.Id, inicio));
        Assert.NotNull(primeiro);

        var segundo = await _service.CriarAgendamentoAsync(
            c.Id, paciente.Id, new AgendamentoRequest(prof.Id, servico.Id, inicio.AddMinutes(15)));

        Assert.Null(segundo);
    }

    [Fact]
    public async Task CriarAgendamento_SemProfissional_DeveAutoAtribuirVinculado()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var prof = await CriarProfissionalAsync(c.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c.Id, semProfissional: true);
        _context.ProfissionaisServicos.Add(new ProfissionalServico
        {
            ProfissionalId = prof.Id,
            ServicoId = servico.Id
        });
        await _context.SaveChangesAsync();
        var paciente = await CriarPacienteAsync(c.Id, "João");

        var inicio = DateTime.UtcNow.Date.AddDays(2).AddHours(10);
        var result = await _service.CriarAgendamentoAsync(
            c.Id, paciente.Id, new AgendamentoRequest(null, servico.Id, inicio));

        Assert.NotNull(result);
        Assert.Equal(prof.Id, result!.ProfissionalId);
    }

    [Fact]
    public async Task ObterHorariosDisponiveis_ProfissionalDeOutroConsultorio_DeveRetornarVazio()
    {
        var c1 = await CriarConsultorioAsync("Clinica A");
        var c2 = await CriarConsultorioAsync("Clinica B");
        var profOutro = await CriarProfissionalAsync(c2.Id, "Dr. Externo");

        var result = await _service.ObterHorariosDisponiveisAsync(
            c1.Id, profOutro.Id, null,
            DateTime.Today.AddDays(1), DateTime.Today.AddDays(3));

        Assert.Empty(result);
    }

    // ── ListarAgendamentosDoPacienteAsync ──

    private async Task<Agendamento> CriarAgendamentoDiretoAsync(
        Guid consultorioId, Guid pacienteId, Guid servicoId, DateTime inicio)
    {
        var a = new Agendamento
        {
            ConsultorioId = consultorioId,
            ServicoId = servicoId,
            PacienteId = pacienteId,
            DataHoraInicio = inicio,
            DataHoraFim = inicio.AddMinutes(30)
        };
        _context.Agendamentos.Add(a);
        await _context.SaveChangesAsync();
        return a;
    }

    [Fact]
    public async Task ListarAgendamentosDoPaciente_DeveRetornarSomenteOsDoPaciente()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var paciente1 = await CriarPacienteAsync(c.Id, "João");
        var paciente2 = await CriarPacienteAsync(c.Id, "Maria");

        await CriarAgendamentoDiretoAsync(c.Id, paciente1.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));
        await CriarAgendamentoDiretoAsync(c.Id, paciente1.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(3).AddHours(11));
        await CriarAgendamentoDiretoAsync(c.Id, paciente2.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(4).AddHours(14));

        var result = await _service.ListarAgendamentosDoPacienteAsync(c.Id, paciente1.Id);

        Assert.Equal(2, result.Count);
        Assert.All(result, a => Assert.Equal(paciente1.Id, a.PacienteId));
        Assert.True(result[0].DataHoraInicio > result[1].DataHoraInicio);
    }

    [Fact]
    public async Task ListarAgendamentosDoPaciente_PacienteDeOutroConsultorio_DeveRetornarVazio()
    {
        var c1 = await CriarConsultorioAsync("Clinica A");
        var c2 = await CriarConsultorioAsync("Clinica B");
        var servico = await CriarServicoAsync(c2.Id);
        var paciente = await CriarPacienteAsync(c2.Id, "João");

        await CriarAgendamentoDiretoAsync(c2.Id, paciente.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var result = await _service.ListarAgendamentosDoPacienteAsync(c1.Id, paciente.Id);

        Assert.Empty(result);
    }

    [Fact]
    public async Task CancelarAgendamentoDoPaciente_DeveCancelarERegistrarHistorico()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, paciente.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var ok = await _service.CancelarAgendamentoDoPacienteAsync(agendamento.Id, c.Id, paciente.Id);

        Assert.True(ok);
        var atualizado = await _context.Agendamentos.FindAsync(agendamento.Id);
        Assert.Equal(StatusAgendamento.Cancelado, atualizado!.Status);
        var historico = await _context.HistoricoAcoes
            .FirstAsync(h => h.EntidadeId == agendamento.Id.ToString());
        Assert.Equal("CancelarAgendamentoPaciente", historico.Acao);
        Assert.Null(historico.UsuarioId);
    }

    [Fact]
    public async Task CancelarAgendamentoDoPaciente_DeOutroPaciente_DeveRetornarFalse()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var dono = await CriarPacienteAsync(c.Id, "João");
        var outro = await CriarPacienteAsync(c.Id, "Maria");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, dono.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var ok = await _service.CancelarAgendamentoDoPacienteAsync(agendamento.Id, c.Id, outro.Id);

        Assert.False(ok);
        var atualizado = await _context.Agendamentos.FindAsync(agendamento.Id);
        Assert.Equal(StatusAgendamento.Agendado, atualizado!.Status);
    }

    // ── ReagendarAgendamentoDoPacienteAsync ──

    private async Task<Agendamento> CriarAgendamentoComProfissionalAsync(
        Guid consultorioId, Guid pacienteId, Guid servicoId, Guid profissionalId, DateTime inicio)
    {
        var a = new Agendamento
        {
            ConsultorioId = consultorioId,
            ProfissionalId = profissionalId,
            ServicoId = servicoId,
            PacienteId = pacienteId,
            DataHoraInicio = inicio,
            DataHoraFim = inicio.AddMinutes(30)
        };
        _context.Agendamentos.Add(a);
        await _context.SaveChangesAsync();
        return a;
    }

    [Fact]
    public async Task ReagendarAgendamentoDoPaciente_DeveReagendarERegistrarHistorico()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, paciente.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var novaData = DateTime.UtcNow.Date.AddDays(4).AddHours(14);
        var result = await _service.ReagendarAgendamentoDoPacienteAsync(
            agendamento.Id, c.Id, paciente.Id, novaData);

        Assert.NotNull(result);
        Assert.Equal(novaData, result!.DataHoraInicio);
        Assert.Equal(novaData.AddMinutes(30), result.DataHoraFim);

        var historico = await _context.HistoricoAcoes
            .FirstAsync(h => h.EntidadeId == agendamento.Id.ToString());
        Assert.Equal("ReagendarAgendamentoPaciente", historico.Acao);
        Assert.Null(historico.UsuarioId);
    }

    [Fact]
    public async Task ReagendarAgendamentoDoPaciente_DeOutroPaciente_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var dono = await CriarPacienteAsync(c.Id, "João");
        var outro = await CriarPacienteAsync(c.Id, "Maria");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, dono.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var result = await _service.ReagendarAgendamentoDoPacienteAsync(
            agendamento.Id, c.Id, outro.Id, DateTime.UtcNow.Date.AddDays(3).AddHours(11));

        Assert.Null(result);
    }

    [Fact]
    public async Task ReagendarAgendamentoDoPaciente_DataNoPassado_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, paciente.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));

        var result = await _service.ReagendarAgendamentoDoPacienteAsync(
            agendamento.Id, c.Id, paciente.Id, DateTime.UtcNow.AddDays(-1));

        Assert.Null(result);
    }

    [Fact]
    public async Task ReagendarAgendamentoDoPaciente_Cancelado_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");
        var agendamento = await CriarAgendamentoDiretoAsync(c.Id, paciente.Id, servico.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));
        agendamento.Status = StatusAgendamento.Cancelado;
        await _context.SaveChangesAsync();

        var result = await _service.ReagendarAgendamentoDoPacienteAsync(
            agendamento.Id, c.Id, paciente.Id, DateTime.UtcNow.Date.AddDays(3).AddHours(11));

        Assert.Null(result);
    }

    [Fact]
    public async Task ReagendarAgendamentoDoPaciente_ConflitoDeHorario_DeveRetornarNull()
    {
        var c = await CriarConsultorioAsync("Clinica A");
        var prof = await CriarProfissionalAsync(c.Id, "Dr. Silva");
        var servico = await CriarServicoAsync(c.Id);
        var paciente = await CriarPacienteAsync(c.Id, "João");
        var agendamento = await CriarAgendamentoComProfissionalAsync(c.Id, paciente.Id, servico.Id, prof.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(10));
        await CriarAgendamentoComProfissionalAsync(c.Id, paciente.Id, servico.Id, prof.Id,
            DateTime.UtcNow.Date.AddDays(2).AddHours(11));

        var result = await _service.ReagendarAgendamentoDoPacienteAsync(
            agendamento.Id, c.Id, paciente.Id, DateTime.UtcNow.Date.AddDays(2).AddHours(11).AddMinutes(15));

        Assert.Null(result);
    }
}
