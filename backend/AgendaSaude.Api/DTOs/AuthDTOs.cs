using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.DTOs;

public record LoginRequest(
    [Required][EmailAddress] string Email,
    [Required][MinLength(6)] string Senha
);

public record LoginResponse(
    string Token,
    string Id,
    string Nome,
    string Email,
    string Perfil,
    Guid ConsultorioId,
    string NomeFantasia,
    string Tema,
    string CorPrimaria,
    string CorSecundaria,
    string CorDestaque,
    string? Icone,
    int DiasAgenda
);

public record CadastroConsultorioRequest(
    [Required][MaxLength(200)] string NomeFantasia,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MaxLength(20)] string TelefoneCelular,
    [Required][MinLength(6)] string Senha,
    string? Documento,
    string? Logradouro,
    string? Numero,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? CEP,
    string? Tema,
    string? CorPrimaria,
    string? CorSecundaria,
    string? CorDestaque,
    string? Icone,
    int? DiasAgenda
);

public record CadastroConsultorioResponse(Guid Id, string NomeFantasia, string Email);

public record ConfiguracaoPrivadaResponse(
    string NomeFantasia,
    string Email,
    string? Documento,
    string TelefoneCelular,
    string? Logradouro,
    string? Numero,
    string? Bairro,
    string? Cidade,
    string? Estado,
    string? CEP,
    string Tema,
    string CorPrimaria,
    string CorSecundaria,
    string CorDestaque,
    string? Icone,
    int DiasAgenda
);

public record ConfiguracaoPublicaResponse(
    string NomeFantasia,
    string Cidade,
    string? Estado,
    string Tema,
    string CorPrimaria,
    string CorSecundaria,
    string CorDestaque,
    string? Icone,
    int DiasAgenda
);

public record ConfiguracaoUpdateRequest(
    string? NomeFantasia,
    string? Tema,
    string? CorPrimaria,
    string? CorSecundaria,
    string? CorDestaque,
    string? Icone,
    int? DiasAgenda
);

public record CadastroPacienteRequest(
    [Required][MaxLength(200)] string Nome,
    [EmailAddress] string? Email,
    [Required][MaxLength(20)] string TelefoneCelular
);

public record CadastroPacienteResponse(Guid Id, string Nome, string? Email);
