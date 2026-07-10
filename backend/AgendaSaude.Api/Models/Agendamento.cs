using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public enum StatusAgendamento
{
    Agendado,
    Confirmado,
    Concluido,
    Cancelado,
    Atendido,
    Faltou,
    Remarcado
}

public class Agendamento
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    public Guid? ProfissionalId { get; set; }

    public Guid ServicoId { get; set; }

    public Guid PacienteId { get; set; }

    [Required] public DateTime DataHoraInicio { get; set; }

    [Required] public DateTime DataHoraFim { get; set; }

    public StatusAgendamento Status { get; set; } = StatusAgendamento.Agendado;

    [MaxLength(500)] public string? Observacoes { get; set; }

    public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public Profissional? Profissional { get; set; }
    public Servico Servico { get; set; } = null!;
    public Paciente Paciente { get; set; } = null!;
}
