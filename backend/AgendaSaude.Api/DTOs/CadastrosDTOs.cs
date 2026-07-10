namespace AgendaSaude.Api.DTOs;

public record ProfissionalRequest(
    string Nome,
    string TelefoneCelular,
    string? Email,
    string? Especialidade,
    string? RegistroProfissional
);

public record ServicoRequest(
    string Nome,
    string? Descricao,
    int DuracaoMinutos,
    decimal Preco,
    string? Cor,
    bool SemProfissional = false
);

public record PacienteCompletoRequest(
    string Nome,
    string Email,
    string TelefoneCelular,
    string? CPF,
    DateTime? DataNascimento,
    string? Logradouro,
    string? Numero,
    string? Complemento,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? CEP
);

public record HorarioDisponivelRequest(
    Guid? ProfissionalId,
    Guid? ServicoId,
    int DiaSemana,
    string HoraInicio,
    string HoraFim
);

public record BloqueioAgendaRequest(
    Guid? ProfissionalId,
    DateTime DataInicio,
    DateTime DataFim,
    string? Motivo
);

public record VincularServicoRequest(Guid ProfissionalId, Guid ServicoId);

public record ProfissionalServicoResponse(Guid ProfissionalId, Guid ServicoId);
