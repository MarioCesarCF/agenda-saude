using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class BloqueioAgenda
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    public Guid? ProfissionalId { get; set; }

    [Required] public DateTime DataInicio { get; set; }

    [Required] public DateTime DataFim { get; set; }

    [MaxLength(300)] public string? Motivo { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public Profissional? Profissional { get; set; }
}
