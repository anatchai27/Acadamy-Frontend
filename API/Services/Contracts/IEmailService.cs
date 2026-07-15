namespace academy_API.Services.Contracts;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct = default);
}