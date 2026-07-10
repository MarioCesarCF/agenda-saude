using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class HorarioDisponivel
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    public Guid? ProfissionalId { get; set; }

    public Guid? ServicoId { get; set; }

    public DayOfWeek DiaSemana { get; set; }

    [Required] public TimeSpan HoraInicio { get; set; }

    [Required] public TimeSpan HoraFim { get; set; }

    public bool Ativo { get; set; } = true;

    public Consultorio Consultorio { get; set; } = null!;
    public Profissional? Profissional { get; set; }
    public Servico? Servico { get; set; }
}
