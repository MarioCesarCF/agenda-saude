using System.ComponentModel.DataAnnotations;

namespace AgendaSaude.Api.Models;

public class HistoricoAcao
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid ConsultorioId { get; set; }

    public Guid? UsuarioId { get; set; }

    [Required][MaxLength(50)] public string Acao { get; set; } = string.Empty;

    [Required][MaxLength(50)] public string Entidade { get; set; } = string.Empty;

    [MaxLength(50)] public string? EntidadeId { get; set; }

    [MaxLength(2000)] public string? Detalhes { get; set; }

    public DateTime DataHora { get; set; } = DateTime.UtcNow;

    public Consultorio Consultorio { get; set; } = null!;
    public Usuario? Usuario { get; set; }
}
