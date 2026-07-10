using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class Servico
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    [Required][MaxLength(200)] public string Nome { get; set; } = string.Empty;

    [MaxLength(500)] public string? Descricao { get; set; }

    public int DuracaoMinutos { get; set; } = 30;

    [DataType(DataType.Currency)]
    public decimal Preco { get; set; }

    [MaxLength(7)] public string? Cor { get; set; }

    public bool SemProfissional { get; set; } = false;

    public bool Ativo { get; set; } = true;

    public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public ICollection<Agendamento> Agendamentos { get; set; } = [];
    public ICollection<ProfissionalServico> ProfissionaisServicos { get; set; } = [];
}
