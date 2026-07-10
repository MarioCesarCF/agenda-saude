namespace AgendaSaude.Api.DTOs;

public record LoginRequest(string Email, string Senha);

public record LoginResponse(
    string Token,
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
    string NomeFantasia,
    string Email,
    string TelefoneCelular,
    string Senha,
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

public record ConfiguracaoResponse(
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
    string Nome,
    string Email,
    string TelefoneCelular,
    string Senha
);

public record CadastroPacienteResponse(Guid Id, string Nome, string? Email);
