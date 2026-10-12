namespace AgendaSaude.Api.Models;

public class RefreshToken
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string TokenHash { get; set; } = string.Empty;

    public Guid ConsultorioId { get; set; }

    public Guid? UsuarioId { get; set; }

    public Guid? PacienteId { get; set; }

    public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

    public DateTime ExpiraEm { get; set; }

    public bool Revogado { get; set; }

    public Consultorio Consultorio { get; set; } = null!;
    public Usuario? Usuario { get; set; }
    public Paciente? Paciente { get; set; }
}
