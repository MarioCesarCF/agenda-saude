using System.Net;
using System.Net.Mail;

namespace AgendaSaude.Api.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<SmtpEmailSender> logger)
    {
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async Task EnviarAsync(string destinatario, string assunto, string corpoHtml)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            // Sem SMTP configurado: em Development apenas loga (fallback), em produção avisa.
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "SMTP não configurado. E-mail NÃO enviado para {Destinatario}. Conteúdo:\n{Corpo}",
                    destinatario, corpoHtml);
            }
            else
            {
                _logger.LogError(
                    "SMTP não configurado — e-mail para {Destinatario} não foi enviado.", destinatario);
            }
            return;
        }

        var porta = int.TryParse(_configuration["Smtp:Port"], out var p) ? p : 587;
        var usuario = _configuration["Smtp:User"];
        var senha = _configuration["Smtp:Password"];
        var remetente = _configuration["Smtp:From"] ?? "noreply@agendasaude.com.br";

        using var client = new SmtpClient(host, porta)
        {
            EnableSsl = true,
            Credentials = new NetworkCredential(usuario, senha)
        };

        using var message = new MailMessage(remetente, destinatario, assunto, corpoHtml)
        {
            IsBodyHtml = true
        };

        await client.SendMailAsync(message);
        _logger.LogInformation("E-mail enviado para {Destinatario}.", destinatario);
    }
}
