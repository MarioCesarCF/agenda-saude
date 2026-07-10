using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.DTOs;

public record UsuarioResponse(
    Guid Id,
    string Nome,
    string Email,
    string Perfil,
    bool Ativo,
    DateTime DataCadastro
);

public record CriarUsuarioRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][EmailAddress][MaxLength(100)] string Email,
    [Required][MinLength(6)] string Senha,
    [Required] string Perfil
);

public record AtualizarUsuarioRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][EmailAddress][MaxLength(100)] string Email,
    string? Perfil
);

public record AtualizarPerfilProprioRequest(
    [Required][MaxLength(200)] string Nome,
    [Required][EmailAddress][MaxLength(100)] string Email
);

public record AlterarSenhaRequest(
    [Required] string SenhaAtual,
    [Required][MinLength(6)] string NovaSenha
);
