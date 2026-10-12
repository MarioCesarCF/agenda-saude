using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.DTOs;

public record CadastroContaPacienteRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MaxLength(20)] string TelefoneCelular,
    [MinLength(6)][MaxLength(100)] string? Senha
);

public record LoginContaPacienteRequest(
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MinLength(6)] string Senha
);

public record ContaPacienteLoginResponse(
    string Token,
    string Id,
    string Nome,
    string Email,
    string? TelefoneCelular,
    string RefreshToken
);

public record AgendamentoContaResponse(
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
    DateTime DataCriacao,
    Guid ConsultorioId,
    string ConsultorioNome,
    string ConsultorioSlug,
    string ConsultorioTema,
    string ConsultorioCorPrimaria,
    string ConsultorioCorSecundaria,
    string ConsultorioCorDestaque,
    string? ConsultorioIcone
);
