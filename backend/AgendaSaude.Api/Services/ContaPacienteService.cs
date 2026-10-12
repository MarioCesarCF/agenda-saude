using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.DTOs;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class ContaPacienteService
{
    private readonly AppDbContext _context;
    private readonly TokenService _tokenService;
    private readonly RefreshTokenService _refreshTokenService;

    public ContaPacienteService(
        AppDbContext context,
        TokenService tokenService,
        RefreshTokenService refreshTokenService)
    {
        _context = context;
        _tokenService = tokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<(ContaPacienteLoginResponse? Resposta, bool EmailEmUso)> CadastrarAsync(
        CadastroContaPacienteRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await _context.ContasPacientes.AnyAsync(c => c.Email == email))
            return (null, true);

        var conta = new ContaPaciente
        {
            Nome = request.Nome.Trim(),
            Email = email,
            TelefoneCelular = string.IsNullOrWhiteSpace(request.TelefoneCelular)
                ? null
                : request.TelefoneCelular.Trim(),
            SenhaHash = string.IsNullOrWhiteSpace(request.Senha)
                ? null
                : BCrypt.Net.BCrypt.HashPassword(request.Senha)
        };

        _context.ContasPacientes.Add(conta);
        await _context.SaveChangesAsync();

        await VincularPacientesAsync(conta);

        return (await GerarRespostaAsync(conta), false);
    }

    public async Task<ContaPacienteLoginResponse?> LoginAsync(LoginContaPacienteRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var conta = await _context.ContasPacientes
            .FirstOrDefaultAsync(c => c.Email == email && c.Ativo);

        if (conta is null || conta.SenhaHash is null
            || !BCrypt.Net.BCrypt.Verify(request.Senha, conta.SenhaHash))
            return null;

        await VincularPacientesAsync(conta);

        return await GerarRespostaAsync(conta);
    }

    public async Task<ContaPacienteLoginResponse?> RefreshAsync(string refreshToken)
    {
        var stored = await _refreshTokenService.ValidarAsync(refreshToken);
        if (stored is null || stored.ContaPacienteId is null) return null;

        var conta = await _context.ContasPacientes
            .FirstOrDefaultAsync(c => c.Id == stored.ContaPacienteId && c.Ativo);
        if (conta is null) return null;

        await _refreshTokenService.RevogarAsync(refreshToken);
        return await GerarRespostaAsync(conta);
    }

    public async Task<ContaPacienteLoginResponse?> ObterPerfilAsync(Guid contaId)
    {
        var conta = await _context.ContasPacientes
            .FirstOrDefaultAsync(c => c.Id == contaId && c.Ativo);
        return conta is null ? null : await GerarRespostaAsync(conta, gerarNovoRefresh: false);
    }

    public async Task<List<AgendamentoContaResponse>> ListarAgendamentosAsync(Guid contaId)
    {
        var pacienteIds = await ResolverPacienteIdsAsync(contaId);
        if (pacienteIds.Count == 0) return [];

        return await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Paciente)
            .Include(a => a.Consultorio)
            .Where(a => pacienteIds.Contains(a.PacienteId))
            .OrderByDescending(a => a.DataHoraInicio)
            .Select(a => new AgendamentoContaResponse(
                a.Id, a.ProfissionalId, a.Profissional != null ? a.Profissional.Nome : "A definir",
                a.ServicoId, a.Servico.Nome, a.Servico.Preco,
                a.PacienteId, a.Paciente.Nome,
                a.DataHoraInicio, a.DataHoraFim,
                a.Status.ToString(), a.DataCriacao,
                a.ConsultorioId, a.Consultorio.NomeFantasia, a.Consultorio.Slug,
                a.Consultorio.Tema, a.Consultorio.CorPrimaria, a.Consultorio.CorSecundaria,
                a.Consultorio.CorDestaque, a.Consultorio.Icone))
            .ToListAsync();
    }

    public async Task<bool> CancelarAgendamentoAsync(Guid contaId, Guid agendamentoId)
    {
        var pacienteIds = await ResolverPacienteIdsAsync(contaId);
        if (pacienteIds.Count == 0) return false;

        var agendamento = await _context.Agendamentos
            .Include(a => a.Servico)
            .Include(a => a.Paciente)
            .FirstOrDefaultAsync(a => a.Id == agendamentoId && pacienteIds.Contains(a.PacienteId));
        if (agendamento is null) return false;

        var detalhes = JsonSerializer.Serialize(new
        {
            profissionalId = agendamento.ProfissionalId,
            servicoNome = agendamento.Servico?.Nome,
            pacienteNome = agendamento.Paciente?.Nome,
            dataHoraInicio = agendamento.DataHoraInicio,
            dataHoraFim = agendamento.DataHoraFim,
            statusAnterior = agendamento.Status.ToString(),
            origem = "ContaPaciente"
        });

        agendamento.Status = StatusAgendamento.Cancelado;

        _context.HistoricoAcoes.Add(new HistoricoAcao
        {
            ConsultorioId = agendamento.ConsultorioId,
            UsuarioId = null,
            Acao = "CancelarAgendamentoPaciente",
            Entidade = "Agendamento",
            EntidadeId = agendamentoId.ToString(),
            Detalhes = detalhes
        });

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<AgendamentoContaResponse?> ReagendarAgendamentoAsync(
        Guid contaId, Guid agendamentoId, DateTime novaDataHoraInicio)
    {
        var pacienteIds = await ResolverPacienteIdsAsync(contaId);
        if (pacienteIds.Count == 0) return null;

        var agendamento = await _context.Agendamentos
            .Include(a => a.Profissional)
            .Include(a => a.Servico)
            .Include(a => a.Paciente)
            .Include(a => a.Consultorio)
            .FirstOrDefaultAsync(a => a.Id == agendamentoId && pacienteIds.Contains(a.PacienteId));
        if (agendamento is null) return null;

        if (agendamento.Status != StatusAgendamento.Agendado
            && agendamento.Status != StatusAgendamento.Confirmado)
            return null;

        if (novaDataHoraInicio < DateTime.UtcNow.AddMinutes(-5)) return null;

        var servico = agendamento.Servico;
        var novaDataFim = novaDataHoraInicio.AddMinutes(servico.DuracaoMinutos);

        if (agendamento.ProfissionalId.HasValue)
        {
            var conflito = await _context.Agendamentos
                .AnyAsync(a => a.Id != agendamentoId
                    && a.ProfissionalId == agendamento.ProfissionalId.Value
                    && (a.Status == StatusAgendamento.Agendado || a.Status == StatusAgendamento.Confirmado)
                    && a.DataHoraInicio < novaDataFim
                    && a.DataHoraFim > novaDataHoraInicio);

            if (conflito) return null;
        }

        var dataAnterior = agendamento.DataHoraInicio;
        var dataAnteriorFim = agendamento.DataHoraFim;

        var detalhes = JsonSerializer.Serialize(new
        {
            de = new { dataHoraInicio = dataAnterior, dataHoraFim = dataAnteriorFim },
            para = new { dataHoraInicio = novaDataHoraInicio, dataHoraFim = novaDataFim },
            profissionalNome = agendamento.Profissional?.Nome,
            servicoNome = agendamento.Servico?.Nome,
            pacienteNome = agendamento.Paciente?.Nome,
            origem = "ContaPaciente"
        });

        agendamento.DataHoraInicio = novaDataHoraInicio;
        agendamento.DataHoraFim = novaDataFim;

        _context.HistoricoAcoes.Add(new HistoricoAcao
        {
            ConsultorioId = agendamento.ConsultorioId,
            UsuarioId = null,
            Acao = "ReagendarAgendamentoPaciente",
            Entidade = "Agendamento",
            EntidadeId = agendamentoId.ToString(),
            Detalhes = detalhes
        });

        await _context.SaveChangesAsync();

        return new AgendamentoContaResponse(
            agendamento.Id, agendamento.ProfissionalId,
            agendamento.Profissional?.Nome ?? "A definir",
            agendamento.ServicoId, agendamento.Servico.Nome, agendamento.Servico.Preco,
            agendamento.PacienteId, agendamento.Paciente.Nome,
            agendamento.DataHoraInicio, agendamento.DataHoraFim,
            agendamento.Status.ToString(), agendamento.DataCriacao,
            agendamento.ConsultorioId, agendamento.Consultorio?.NomeFantasia ?? "",
            agendamento.Consultorio?.Slug ?? "", agendamento.Consultorio?.Tema ?? "light",
            agendamento.Consultorio?.CorPrimaria ?? "#059669", agendamento.Consultorio?.CorSecundaria ?? "#10b981",
            agendamento.Consultorio?.CorDestaque ?? "#f59e0b", agendamento.Consultorio?.Icone);
    }

    private async Task<List<Guid>> ResolverPacienteIdsAsync(Guid contaId)
    {
        var conta = await _context.ContasPacientes
            .FirstOrDefaultAsync(c => c.Id == contaId);
        if (conta is null) return [];

        var email = conta.Email.ToLowerInvariant();

        return await _context.Pacientes
            .Where(p => p.ContaPacienteId == contaId
                || (p.Email != null && p.Email.ToLower() == email))
            .Select(p => p.Id)
            .ToListAsync();
    }

    private async Task VincularPacientesAsync(ContaPaciente conta)
    {
        var email = conta.Email.ToLowerInvariant();

        var orfaos = await _context.Pacientes
            .Where(p => p.ContaPacienteId == null
                && p.Email != null && p.Email.ToLower() == email)
            .ToListAsync();

        if (orfaos.Count == 0) return;

        foreach (var p in orfaos)
            p.ContaPacienteId = conta.Id;

        await _context.SaveChangesAsync();
    }

    private async Task<ContaPacienteLoginResponse> GerarRespostaAsync(
        ContaPaciente conta, bool gerarNovoRefresh = true)
    {
        var token = _tokenService.GerarTokenContaPaciente(conta.Id, conta.Email, conta.Nome);

        var refresh = gerarNovoRefresh
            ? await _refreshTokenService.GerarAsync(null, null, null, conta.Id)
            : "";

        return new ContaPacienteLoginResponse(
            token, conta.Id.ToString(), conta.Nome, conta.Email,
            string.IsNullOrWhiteSpace(conta.TelefoneCelular) ? null : conta.TelefoneCelular,
            refresh);
    }
}
