using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using AgendaSaude.Api.Data;
using AgendaSaude.Api.Models;

namespace AgendaSaude.Api.Services;

public class ResetSenhaService
{
    private const int ExpiracaoMinutos = 15;

    private readonly AppDbContext _context;
    private readonly IEmailSender _emailSender;
    private readonly ILogger<ResetSenhaService> _logger;

    public ResetSenhaService(
        AppDbContext context,
        IEmailSender emailSender,
        ILogger<ResetSenhaService> logger)
    {
        _context = context;
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task SolicitarResetAsync(string email)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Email == email && u.Ativo);
        if (usuario is null)
        {
            // Não revela a existência do e-mail.
            _logger.LogInformation("Solicitação de reset para e-mail inexistente.");
            return;
        }

        var anteriores = await _context.ResetTokens
            .Where(t => t.UsuarioId == usuario.Id && !t.Usado)
            .ToListAsync();
        foreach (var anterior in anteriores)
            anterior.Usado = true;

        var codigo = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

        _context.ResetTokens.Add(new ResetToken
        {
            UsuarioId = usuario.Id,
            TokenHash = Hash(codigo),
            ExpiraEm = DateTime.UtcNow.AddMinutes(ExpiracaoMinutos)
        });

        await _context.SaveChangesAsync();

        try
        {
            await _emailSender.EnviarAsync(
                usuario.Email,
                "Recuperação de senha - Agenda Saúde",
                MontarCorpo(usuario.Nome, codigo));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Falha ao enviar e-mail de recuperação para {Email}.", usuario.Email);
        }
    }

    public async Task<bool> ResetarSenhaAsync(string codigo, string novaSenha)
    {
        var hash = Hash(codigo);
        var agora = DateTime.UtcNow;

        var token = await _context.ResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == hash && !t.Usado && t.ExpiraEm > agora);
        if (token is null) return false;

        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Id == token.UsuarioId && u.Ativo);
        if (usuario is null) return false;

        usuario.SenhaHash = BCrypt.Net.BCrypt.HashPassword(novaSenha);
        token.Usado = true;
        await _context.SaveChangesAsync();
        return true;
    }

    private static string Hash(string codigo)
        => Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(codigo)));

    private static string MontarCorpo(string nome, string codigo) => $"""
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #059669;">Agenda Saúde</h2>
          <p>Olá, {nome}.</p>
          <p>Recebemos uma solicitação para redefinir sua senha. Use o código abaixo:</p>
          <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #059669;">{codigo}</p>
          <p>O código expira em {ExpiracaoMinutos} minutos e pode ser usado apenas uma vez.</p>
          <p>Se você não solicitou, ignore este e-mail.</p>
        </div>
        """;
}
