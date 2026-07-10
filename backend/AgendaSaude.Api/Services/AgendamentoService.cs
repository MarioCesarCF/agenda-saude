using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class AgendamentoService
{
    private readonly AppDbContext _context;

    public AgendamentoService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AgendamentoResponse>> ListarAgendamentosAsync(
        Guid consultorioId, DateTime? data = null, Guid? profissionalId = null)
    {
        var query = _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Paciente)
            .Where(a => a.ConsultorioId == consultorioId);

        if (data.HasValue)
        {
            var dia = data.Value.Date;
            query = query.Where(a => a.DataHoraInicio.Date == dia);
        }

        if (profissionalId.HasValue)
            query = query.Where(a => a.ProfissionalId == profissionalId.Value);

        return await query
            .OrderBy(a => a.DataHoraInicio)
            .Select(a => new AgendamentoResponse(
                a.Id, a.ProfissionalId, a.Profissional != null ? a.Profissional.Nome : "A definir",
                a.ServicoId, a.Servico.Nome, a.Servico.Preco,
                a.PacienteId, a.Paciente.Nome,
                a.DataHoraInicio, a.DataHoraFim,
                a.Status.ToString(), a.DataCriacao))
            .ToListAsync();
    }

    public async Task<AgendamentoResponse?> CriarAgendamentoAsync(
        Guid consultorioId, Guid pacienteId, AgendamentoRequest request)
    {
        var servico = await _context.Servicos
            .FirstOrDefaultAsync(s => s.Id == request.ServicoId && s.ConsultorioId == consultorioId);
        if (servico is null) return null;

        var dataFim = request.DataHoraInicio.AddMinutes(servico.DuracaoMinutos);

        Guid? profissionalId = request.ProfissionalId;

        if (!profissionalId.HasValue && servico.SemProfissional)
        {
            var profissionaisVinculados = await _context.ProfissionaisServicos
                .Where(ps => ps.ServicoId == servico.Id)
                .Select(ps => ps.ProfissionalId)
                .ToListAsync();

            var idsParaBuscar = profissionaisVinculados.Count > 0
                ? profissionaisVinculados
                : await _context.Profissionais
                    .Where(p => p.ConsultorioId == consultorioId && p.Ativo)
                    .Select(p => p.Id)
                    .ToListAsync();

            foreach (var profId in idsParaBuscar)
            {
                var conflito = await _context.Agendamentos
                    .AnyAsync(a => a.ProfissionalId == profId
                        && (a.Status == StatusAgendamento.Agendado || a.Status == StatusAgendamento.Confirmado)
                        && a.DataHoraInicio < dataFim
                        && a.DataHoraFim > request.DataHoraInicio);

                if (!conflito)
                {
                    profissionalId = profId;
                    break;
                }
            }

            if (!profissionalId.HasValue) return null;
        }

        if (profissionalId.HasValue)
        {
            var conflito = await _context.Agendamentos
                .AnyAsync(a => a.ProfissionalId == profissionalId.Value
                    && (a.Status == StatusAgendamento.Agendado || a.Status == StatusAgendamento.Confirmado)
                    && a.DataHoraInicio < dataFim
                    && a.DataHoraFim > request.DataHoraInicio);

            if (conflito) return null;
        }

        var agendamento = new Agendamento
        {
            ConsultorioId = consultorioId,
            ProfissionalId = profissionalId,
            ServicoId = request.ServicoId,
            PacienteId = pacienteId,
            DataHoraInicio = request.DataHoraInicio,
            DataHoraFim = dataFim
        };

        _context.Agendamentos.Add(agendamento);
        await _context.SaveChangesAsync();

        return await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Paciente)
            .Where(a => a.Id == agendamento.Id)
            .Select(a => new AgendamentoResponse(
                a.Id, a.ProfissionalId, a.Profissional != null ? a.Profissional.Nome : "A definir",
                a.ServicoId, a.Servico.Nome, a.Servico.Preco,
                a.PacienteId, a.Paciente.Nome,
                a.DataHoraInicio, a.DataHoraFim,
                a.Status.ToString(), a.DataCriacao))
            .FirstAsync();
    }

    public async Task<bool> CancelarAgendamentoAsync(Guid id, Guid consultorioId)
    {
        var agendamento = await _context.Agendamentos
            .FirstOrDefaultAsync(a => a.Id == id && a.ConsultorioId == consultorioId);
        if (agendamento is null) return false;

        agendamento.Status = StatusAgendamento.Cancelado;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AtualizarStatusAsync(Guid id, Guid consultorioId, StatusAgendamento novoStatus)
    {
        var agendamento = await _context.Agendamentos
            .FirstOrDefaultAsync(a => a.Id == id && a.ConsultorioId == consultorioId);
        if (agendamento is null) return false;

        agendamento.Status = novoStatus;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<HorariosDisponiveisResponse>> ObterHorariosDisponiveisAsync(
        Guid consultorioId, Guid profissionalId, Guid? servicoId = null,
        DateTime? dataInicio = null, DateTime? dataFim = null)
    {
        var inicio = dataInicio ?? DateTime.Today;
        var fim = dataFim ?? DateTime.Today.AddDays(14);

        var servico = servicoId.HasValue
            ? await _context.Servicos.FirstOrDefaultAsync(s => s.Id == servicoId.Value)
            : null;
        var slotDuracao = servico?.DuracaoMinutos ?? 30;
        var slotSpan = TimeSpan.FromMinutes(slotDuracao);

        var horariosSemanais = await _context.HorariosDisponiveis
            .Where(h => h.ConsultorioId == consultorioId
                && h.ProfissionalId == profissionalId
                && h.Ativo)
            .ToListAsync();

        var bloqueios = await _context.BloqueiosAgenda
            .Where(b => b.ConsultorioId == consultorioId
                && (b.ProfissionalId == null || b.ProfissionalId == profissionalId)
                && b.DataInicio < fim
                && b.DataFim > inicio)
            .ToListAsync();

        var agendamentos = await _context.Agendamentos
            .Where(a => a.ConsultorioId == consultorioId
                && a.ProfissionalId == profissionalId
                && (a.Status == StatusAgendamento.Agendado || a.Status == StatusAgendamento.Confirmado)
                && a.DataHoraInicio >= inicio
                && a.DataHoraInicio < fim)
            .ToListAsync();

        var resultados = new List<HorariosDisponiveisResponse>();

        for (var data = inicio.Date; data <= fim.Date; data = data.AddDays(1))
        {
            if (bloqueios.Any(b => b.DataInicio.Date <= data && b.DataFim.Date >= data))
                continue;

            var horarioSemanal = horariosSemanais
                .FirstOrDefault(h => h.DiaSemana == data.DayOfWeek);
            if (horarioSemanal is null) continue;

            var horarios = new List<TimeSpan>();
            var slotAtual = horarioSemanal.HoraInicio;

            while (slotAtual <= horarioSemanal.HoraFim - slotSpan)
            {
                var inicioSlot = data.Date.Add(slotAtual);
                var fimSlot = inicioSlot.Add(slotSpan);
                var ocupado = agendamentos.Any(a =>
                    a.DataHoraInicio < fimSlot && a.DataHoraFim > inicioSlot);

                if (!ocupado)
                    horarios.Add(slotAtual);

                slotAtual = slotAtual.Add(slotSpan);
            }

            resultados.Add(new HorariosDisponiveisResponse(data, horarios));
        }

        return resultados;
    }

    public async Task<List<HorariosDisponiveisResponse>> ObterHorariosDisponiveisSemProfissionalAsync(
        Guid consultorioId, Guid servicoId,
        DateTime? dataInicio = null, DateTime? dataFim = null)
    {
        var inicio = dataInicio ?? DateTime.Today;
        var fim = dataFim ?? DateTime.Today.AddDays(14);

        var servico = await _context.Servicos.FirstOrDefaultAsync(s => s.Id == servicoId);
        if (servico is null) return [];

        var slotDuracao = servico.DuracaoMinutos;
        var slotSpan = TimeSpan.FromMinutes(slotDuracao);

        var profissionaisIds = await _context.ProfissionaisServicos
            .Where(ps => ps.ServicoId == servicoId)
            .Select(ps => ps.ProfissionalId)
            .ToListAsync();

        if (profissionaisIds.Count == 0)
        {
            profissionaisIds = await _context.Profissionais
                .Where(p => p.ConsultorioId == consultorioId && p.Ativo)
                .Select(p => p.Id)
                .ToListAsync();
        }

        var horariosServico = await _context.HorariosDisponiveis
            .Where(h => h.ConsultorioId == consultorioId
                && h.Ativo
                && h.ServicoId == servicoId
                && h.ProfissionalId == null)
            .ToListAsync();

        var usarHorariosServico = horariosServico.Count > 0;

        var horariosSemanais = usarHorariosServico
            ? horariosServico
            : await _context.HorariosDisponiveis
                .Where(h => h.ConsultorioId == consultorioId
                    && h.Ativo
                    && h.ServicoId == null
                    && (h.ProfissionalId == null || profissionaisIds.Contains(h.ProfissionalId.Value)))
                .ToListAsync();

        var bloqueios = await _context.BloqueiosAgenda
            .Where(b => b.ConsultorioId == consultorioId
                && (b.ProfissionalId == null || profissionaisIds.Contains(b.ProfissionalId.Value))
                && b.DataInicio < fim
                && b.DataFim > inicio)
            .ToListAsync();

        var agendamentos = await _context.Agendamentos
            .Where(a => a.ConsultorioId == consultorioId
                && a.ProfissionalId.HasValue
                && profissionaisIds.Contains(a.ProfissionalId.Value)
                && (a.Status == StatusAgendamento.Agendado || a.Status == StatusAgendamento.Confirmado)
                && a.DataHoraInicio >= inicio
                && a.DataHoraInicio < fim)
            .ToListAsync();

        var resultados = new List<HorariosDisponiveisResponse>();

        for (var data = inicio.Date; data <= fim.Date; data = data.AddDays(1))
        {
            if (bloqueios.Any(b => b.DataInicio.Date <= data && b.DataFim.Date >= data))
                continue;

            var horariosDia = horariosSemanais.Where(h => h.DiaSemana == data.DayOfWeek).ToList();

            var profHorarios = horariosDia.Where(h => h.ProfissionalId.HasValue).ToList();
            var clinicHorarios = horariosDia.Where(h => !h.ProfissionalId.HasValue).ToList();

            var profIdsComHorario = profHorarios.Select(h => h.ProfissionalId!.Value).Distinct().ToList();

            if (profIdsComHorario.Count == 0 && clinicHorarios.Count == 0) continue;

            var horarios = new List<TimeSpan>();

            if (usarHorariosServico)
            {
                var svcHorario = clinicHorarios.First();
                var slotAtual = svcHorario.HoraInicio;

                while (slotAtual <= svcHorario.HoraFim - slotSpan)
                {
                    var inicioSlot = data.Date.Add(slotAtual);
                    var fimSlot = inicioSlot.Add(slotSpan);

                    var todosLivres = profissionaisIds.Count == 0 || profissionaisIds.Any(pid =>
                    {
                        var horarioProf = profHorarios.FirstOrDefault(h => h.ProfissionalId == pid);
                        if (horarioProf is not null)
                        {
                            if (slotAtual < horarioProf.HoraInicio || slotAtual + slotSpan > horarioProf.HoraFim)
                                return false;
                        }

                        return !agendamentos.Any(a =>
                            a.ProfissionalId == pid
                            && a.DataHoraInicio < fimSlot
                            && a.DataHoraFim > inicioSlot);
                    });

                    if (todosLivres)
                        horarios.Add(slotAtual);

                    slotAtual = slotAtual.Add(slotSpan);
                }
            }
            else if (profIdsComHorario.Count > 0)
            {
                var slotAtual = profHorarios.First().HoraInicio;
                var horaFimMax = profIdsComHorario
                    .Select(pid => profHorarios.First(h => h.ProfissionalId == pid).HoraFim)
                    .Max();

                while (slotAtual <= horaFimMax - slotSpan)
                {
                    var inicioSlot = data.Date.Add(slotAtual);
                    var fimSlot = inicioSlot.Add(slotSpan);

                    var peloMenosUmLivre = profIdsComHorario.Any(pid =>
                    {
                        var horarioProf = profHorarios.FirstOrDefault(h => h.ProfissionalId == pid);
                        if (horarioProf is null) return false;
                        if (slotAtual < horarioProf.HoraInicio || slotAtual + slotSpan > horarioProf.HoraFim) return false;

                        return !agendamentos.Any(a =>
                            a.ProfissionalId == pid
                            && a.DataHoraInicio < fimSlot
                            && a.DataHoraFim > inicioSlot);
                    });

                    if (peloMenosUmLivre)
                        horarios.Add(slotAtual);

                    slotAtual = slotAtual.Add(slotSpan);
                }
            }
            else
            {
                var clinicHorario = clinicHorarios.First();
                var slotAtual = clinicHorario.HoraInicio;

                while (slotAtual <= clinicHorario.HoraFim - slotSpan)
                {
                    var inicioSlot = data.Date.Add(slotAtual);
                    var fimSlot = inicioSlot.Add(slotSpan);

                    var peloMenosUmLivre = profissionaisIds.Any(pid =>
                    {
                        var horarioProf = profHorarios.FirstOrDefault(h => h.ProfissionalId == pid);
                        if (horarioProf is not null)
                        {
                            if (slotAtual < horarioProf.HoraInicio || slotAtual + slotSpan > horarioProf.HoraFim)
                                return false;
                        }

                        return !agendamentos.Any(a =>
                            a.ProfissionalId == pid
                            && a.DataHoraInicio < fimSlot
                            && a.DataHoraFim > inicioSlot);
                    });

                    if (peloMenosUmLivre)
                        horarios.Add(slotAtual);

                    slotAtual = slotAtual.Add(slotSpan);
                }
            }

            if (horarios.Count > 0)
                resultados.Add(new HorariosDisponiveisResponse(data, horarios));
        }

        return resultados;
    }
}
