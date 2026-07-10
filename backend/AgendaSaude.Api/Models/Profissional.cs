using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class Profissional
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    [Required][MaxLength(200)] public string Nome { get; set; } = string.Empty;

    [MaxLength(100)] public string? Email { get; set; }

    [Required][MaxLength(20)] public string TelefoneCelular { get; set; } = string.Empty;

    [MaxLength(100)] public string? Especialidade { get; set; }

    [MaxLength(50)] public string? RegistroProfissional { get; set; }

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = [];
    public ICollection<HorarioDisponivel> HorariosDisponiveis { get; set; } = [];
    public ICollection<BloqueioAgenda> BloqueiosAgenda { get; set; } = [];
    public ICollection<ProfissionalServico> ProfissionaisServicos { get; set; } = [];
}
