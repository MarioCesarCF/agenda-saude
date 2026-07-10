using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Consultorio> Consultorios => Set<Consultorio>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Profissional> Profissionais => Set<Profissional>();
    public DbSet<Servico> Servicos => Set<Servico>();
    public DbSet<Paciente> Pacientes => Set<Paciente>();
    public DbSet<Agendamento> Agendamentos => Set<Agendamento>();
    public DbSet<HorarioDisponivel> HorariosDisponiveis => Set<HorarioDisponivel>();
    public DbSet<BloqueioAgenda> BloqueiosAgenda => Set<BloqueioAgenda>();
    public DbSet<ProfissionalServico> ProfissionaisServicos => Set<ProfissionalServico>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Consultorio>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.HasIndex(c => c.Email).IsUnique();
            entity.Property(c => c.Documento).HasMaxLength(20);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => new { u.Email, u.ConsultorioId }).IsUnique();
            entity.HasOne(u => u.Consultorio)
                  .WithMany(c => c.Usuarios)
                  .HasForeignKey(u => u.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Profissional>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasOne(p => p.Consultorio)
                  .WithMany(c => c.Profissionais)
                  .HasForeignKey(p => p.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Servico>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.HasOne(s => s.Consultorio)
                  .WithMany(c => c.Servicos)
                  .HasForeignKey(s => s.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Paciente>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.HasOne(p => p.Consultorio)
                  .WithMany(c => c.Pacientes)
                  .HasForeignKey(p => p.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Agendamento>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.HasOne(a => a.Consultorio)
                  .WithMany(c => c.Agendamentos)
                  .HasForeignKey(a => a.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(a => a.Profissional)
                  .WithMany(p => p.Agendamentos)
                  .HasForeignKey(a => a.ProfissionalId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Servico)
                  .WithMany(s => s.Agendamentos)
                  .HasForeignKey(a => a.ServicoId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Paciente)
                  .WithMany(p => p.Agendamentos)
                  .HasForeignKey(a => a.PacienteId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(a => new { a.ProfissionalId, a.DataHoraInicio });
        });

        modelBuilder.Entity<HorarioDisponivel>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.HasOne(h => h.Consultorio)
                  .WithMany(c => c.HorariosDisponiveis)
                  .HasForeignKey(h => h.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(h => h.Profissional)
                  .WithMany(p => p.HorariosDisponiveis)
                  .HasForeignKey(h => h.ProfissionalId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BloqueioAgenda>(entity =>
        {
            entity.HasKey(b => b.Id);
            entity.HasOne(b => b.Consultorio)
                  .WithMany(c => c.BloqueiosAgenda)
                  .HasForeignKey(b => b.ConsultorioId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(b => b.Profissional)
                  .WithMany(p => p.BloqueiosAgenda)
                  .HasForeignKey(b => b.ProfissionalId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProfissionalServico>(entity =>
        {
            entity.HasKey(ps => new { ps.ProfissionalId, ps.ServicoId });
            entity.HasOne(ps => ps.Profissional)
                  .WithMany(p => p.ProfissionaisServicos)
                  .HasForeignKey(ps => ps.ProfissionalId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(ps => ps.Servico)
                  .WithMany(s => s.ProfissionaisServicos)
                  .HasForeignKey(ps => ps.ServicoId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
