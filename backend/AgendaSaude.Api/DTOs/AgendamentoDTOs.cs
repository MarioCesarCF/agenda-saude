using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.DTOs;

public record AgendamentoRequest(
    Guid? ProfissionalId,
    Guid ServicoId,
    DateTime DataHoraInicio
);

public record AgendamentoResponse(
    Guid Id,
    Guid? ProfissionalId,
    string ProfissionalNome,
    Guid ServicoId,
    string ServicoNome,
    decimal ServicoPreco,
    Guid PacienteId,
    string PacienteNome,
    DateTime DataHoraInicio,
    DateTime DataHoraFim,
    string Status,
    DateTime DataCriacao
);

public record AgendaDiaResponse(
    DateTime Data,
    List<AgendamentoResponse> Agendamentos
);

public record HorariosDisponiveisResponse(
    DateTime Data,
    List<TimeSpan> Horarios
);

public record AtualizarStatusRequest(
    [Required] string Status
);

public record ReagendarRequest(
    [Required] DateTime NovaDataHoraInicio
);

public record ExcluirAgendamentoRequest(
    string? Motivo
);

public record ProfissionalResponse(
    Guid Id,
    string Nome,
    string? Especialidade,
    string? RegistroProfissional
);

public record ServicoResponse(
    Guid Id,
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal Preco,
    string? Cor,
    bool SemProfissional
);

public record HorarioDisponivelResponse(
    Guid Id,
    Guid? ProfissionalId,
    string? ProfissionalNome,
    Guid? ServicoId,
    string? ServicoNome,
    int DiaSemana,
    string HoraInicio,
    string HoraFim
);
