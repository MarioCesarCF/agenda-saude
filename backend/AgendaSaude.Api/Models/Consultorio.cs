using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class Consultorio
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required][MaxLength(200)] public string NomeFantasia { get; set; } = string.Empty;

    [MaxLength(200)] public string? RazaoSocial { get; set; }

    [MaxLength(20)] public string? Documento { get; set; }

    [Required][MaxLength(100)] public string Email { get; set; } = string.Empty;

    [Required][MaxLength(20)] public string TelefoneCelular { get; set; } = string.Empty;

    [MaxLength(20)] public string? TelefoneFixo { get; set; }

    [MaxLength(200)] public string? Logradouro { get; set; }

    [MaxLength(20)] public string? Numero { get; set; }

    [MaxLength(100)] public string? Complemento { get; set; }

    [MaxLength(100)] public string? Bairro { get; set; }

    [MaxLength(100)] public string? Cidade { get; set; }

    [MaxLength(2)] public string? Estado { get; set; }

    [MaxLength(10)] public string? CEP { get; set; }

    [MaxLength(20)] public string Tema { get; set; } = "light";

    [MaxLength(7)] public string CorPrimaria { get; set; } = "#059669";

    [MaxLength(7)] public string CorSecundaria { get; set; } = "#10b981";

    [MaxLength(7)] public string CorDestaque { get; set; } = "#f59e0b";

    [MaxLength(30)] public string? Icone { get; set; }

    public int DiasAgenda { get; set; } = 2;

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public ICollection<Usuario> Usuarios { get; set; } = [];
    public ICollection<Profissional> Profissionais { get; set; } = [];
    public ICollection<Servico> Servicos { get; set; } = [];
    public ICollection<Paciente> Pacientes { get; set; } = [];
    public ICollection<Agendamento> Agendamentos { get; set; } = [];
    public ICollection<HorarioDisponivel> HorariosDisponiveis { get; set; } = [];
    public ICollection<BloqueioAgenda> BloqueiosAgenda { get; set; } = [];
}
