using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class Paciente
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    [Required][MaxLength(200)] public string Nome { get; set; } = string.Empty;

    [MaxLength(100)] public string? Email { get; set; }

    [Required][MaxLength(20)] public string TelefoneCelular { get; set; } = string.Empty;

    public string? SenhaHash { get; set; }

    [MaxLength(20)] public string? GoogleId { get; set; }

    [MaxLength(11)] public string? CPF { get; set; }

    public DateTime? DataNascimento { get; set; }

    [MaxLength(200)] public string? Logradouro { get; set; }

    [MaxLength(20)] public string? Numero { get; set; }

    [MaxLength(100)] public string? Complemento { get; set; }

    [MaxLength(100)] public string? Bairro { get; set; }

    [MaxLength(100)] public string? Cidade { get; set; }

    [MaxLength(2)] public string? Estado { get; set; }

    [MaxLength(10)] public string? CEP { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = [];
}
