namespace AgendaSaude.Api.Models;

public class ProfissionalServico
{
    public Guid ProfissionalId { get; set; }
    public Guid ServicoId { get; set; }
    public Profissional Profissional { get; set; } = null!;
    public Servico Servico { get; set; } = null!;
}
