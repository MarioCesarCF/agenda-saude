using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public enum PerfilUsuario
{
    Admin,
    Atendente,
    Profissional
}

public class Usuario
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    [Required][MaxLength(200)] public string Nome { get; set; } = string.Empty;

    [Required][MaxLength(100)] public string Email { get; set; } = string.Empty;

    [Required] public string SenhaHash { get; set; } = string.Empty;

    public PerfilUsuario Perfil { get; set; } = PerfilUsuario.Admin;

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
}
