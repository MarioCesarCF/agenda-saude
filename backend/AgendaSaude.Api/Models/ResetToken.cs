namespace AgendaSaude.Api.Models;

public class ResetToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UsuarioId { get; set; }

    public string TokenHash { get; set; } = string.Empty;

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public DateTime ExpiraEm { get; set; }

    public bool Usado { get; set; }

    public Usuario Usuario { get; set; } = null!;
}
