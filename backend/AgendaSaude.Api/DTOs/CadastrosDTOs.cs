using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.DTOs;

public record ProfissionalRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][MaxLength(20)] string TelefoneCelular,
    string? Email,
    string? Especialidade,
    string? RegistroProfissional
);

public record ServicoRequest(
    [Required][MaxLength(200)] string Nome,
    string? Descricao,
    [Range(5, 480)] int DuracaoMinutos,
    [Range(0, 99999.99)] decimal Preco,
    string? Cor,
    bool SemProfissional
);

public record PacienteCompletoRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MaxLength(20)] string TelefoneCelular,
    [MaxLength(11)] string? CPF,
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
    [Range(0, 6)] int DiaSemana,
    [Required] string HoraInicio,
    [Required] string HoraFim
);

public record BloqueioAgendaRequest(
    Guid? ProfissionalId,
    [Required] DateTime DataInicio,
    [Required] DateTime DataFim,
    string? Motivo
);

public record VincularServicoRequest(
    [Required] Guid ProfissionalId,
    [Required] Guid ServicoId
);

public record ProfissionalServicoResponse(Guid ProfissionalId, Guid ServicoId);
