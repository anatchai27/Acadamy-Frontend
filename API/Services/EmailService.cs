using System.Net;
using System.Net.Mail;
using academy_API.Services.Contracts;
using Microsoft.Extensions.Configuration;

namespace academy_API.Services;

public class EmailService(IConfiguration config) : IEmailService
{
    private readonly IConfiguration _config = config;

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var smtpHost = _config["Smtp:Host"] ?? throw new InvalidOperationException("SMTP Host not configured.");
        var smtpPort = int.Parse(_config["Smtp:Port"] ?? "587");
        var smtpUser = _config["Smtp:Username"] ?? throw new InvalidOperationException("SMTP Username not configured.");
        var smtpPass = _config["Smtp:Password"] ?? throw new InvalidOperationException("SMTP Password not configured.");
        var fromEmail = _config["Smtp:FromEmail"] ?? smtpUser;
        var fromName = _config["Smtp:FromName"] ?? "Academy";

        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPass),
            EnableSsl = true
        };

        var mailMessage = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        mailMessage.To.Add(to);

        await client.SendMailAsync(mailMessage, ct);
    }
}