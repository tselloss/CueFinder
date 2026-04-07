using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Email service implementation using SMTP
    /// </summary>
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> settings, ILogger<EmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Send an email to a single recipient
        /// </summary>
        public async Task SendAsync(string to, string subject, string body, bool isHtml = true)
        {
            if (!IsConfigured())
            {
                _logger.LogWarning("Email service is not configured. Email to {To} not sent.", to);
                return;
            }

            try
            {
                using (var client = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort))
                {
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;
                    client.UseDefaultCredentials = false;
                    client.EnableSsl = _settings.EnableSsl;
                    client.Credentials = new NetworkCredential(_settings.FromEmail, _settings.SmtpPassword);

                    using (var message = new MailMessage())
                    {
                        message.From = new MailAddress(_settings.FromEmail, _settings.FromName);
                        message.To.Add(new MailAddress(to));
                        message.Subject = subject;
                        message.Body = body;
                        message.IsBodyHtml = isHtml;

                        await client.SendMailAsync(message);

                        _logger.LogInformation("Email sent successfully to {To} with subject '{Subject}'", to, subject);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To}", to);
                throw;
            }
        }

        /// <summary>
        /// Send an email to multiple recipients
        /// </summary>
        public async Task SendBatchAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true)
        {
            if (!IsConfigured())
            {
                _logger.LogWarning("Email service is not configured. Batch email not sent.");
                return;
            }

            try
            {
                using (var client = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort))
                {
                    client.DeliveryMethod = SmtpDeliveryMethod.Network;
                    client.UseDefaultCredentials = false;
                    client.EnableSsl = _settings.EnableSsl;
                    client.Credentials = new NetworkCredential(_settings.FromEmail, _settings.SmtpPassword);

                    using (var message = new MailMessage())
                    {
                        message.From = new MailAddress(_settings.FromEmail, _settings.FromName);

                        foreach (var recipient in recipients)
                        {
                            message.To.Add(new MailAddress(recipient));
                        }

                        message.Subject = subject;
                        message.Body = body;
                        message.IsBodyHtml = isHtml;

                        await client.SendMailAsync(message);

                        _logger.LogInformation("Batch email sent successfully to {Count} recipients with subject '{Subject}'", 
                            recipients.Count(), subject);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send batch email to {Count} recipients", recipients.Count());
                throw;
            }
        }

        /// <summary>
        /// Check if email service is properly configured
        /// </summary>
        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(_settings.SmtpServer) &&
                   !string.IsNullOrWhiteSpace(_settings.FromEmail) &&
                   !string.IsNullOrWhiteSpace(_settings.SmtpPassword) &&
                   _settings.SmtpPort > 0;
        }
    }
}
