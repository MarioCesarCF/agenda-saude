using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class ContaPaciente
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required][MaxLength(100)] public string Email { get; set; } = string.Empty;

    [Required][MaxLength(200)] public string Nome { get; set; } = string.Empty;

    [MaxLength(20)] public string? TelefoneCelular { get; set; }

    public string? SenhaHash { get; set; }

    [MaxLength(64)] public string? GoogleId { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public ICollection<Paciente> Pacientes { get; set; } = [];
}
