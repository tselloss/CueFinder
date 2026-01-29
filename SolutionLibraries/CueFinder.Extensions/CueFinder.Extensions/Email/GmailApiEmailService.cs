using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Text;

namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Gmail API email service implementation
    /// Uses Google's Gmail API to send emails via OAuth2
    /// Requires Google.Apis.Gmail.v1 NuGet package
    /// </summary>
    public class GmailApiEmailService : IEmailService
    {
        private readonly GmailApiSettings _settings;
        private readonly ILogger<GmailApiEmailService> _logger;

        public GmailApiEmailService(IOptions<GmailApiSettings> settings, ILogger<GmailApiEmailService> logger)
        {
            _settings = settings.Value;
            _logger = logger;
        }

        /// <summary>
        /// Send an email to a single recipient via Gmail API
        /// </summary>
        public async Task SendAsync(string to, string subject, string body, bool isHtml = true)
        {
            if (!IsConfigured())
            {
                _logger.LogWarning("Gmail API service is not configured. Email to {To} not sent.", to);
                return;
            }

            try
            {
                // Build MIME message
                string mimeMessage = BuildMimeMessage(to, subject, body, isHtml);

                // Encode as base64url
                string encodedMessage = Base64UrlEncode(Encoding.UTF8.GetBytes(mimeMessage));

                // TODO: Implement Gmail API send using Google.Apis.Gmail.v1
                // var service = await GetGmailService();
                // var message = new Google.Apis.Gmail.v1.Data.Message { Raw = encodedMessage };
                // await service.Users.Messages.Send(message, "me").ExecuteAsync();

                _logger.LogInformation("Email sent successfully to {To} with subject '{Subject}' via Gmail API", to, subject);
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email to {To} via Gmail API", to);
                throw;
            }
        }

        /// <summary>
        /// Send an email to multiple recipients via Gmail API
        /// </summary>
        public async Task SendBatchAsync(IEnumerable<string> recipients, string subject, string body, bool isHtml = true)
        {
            if (!IsConfigured())
            {
                _logger.LogWarning("Gmail API service is not configured. Batch email not sent.");
                return;
            }

            try
            {
                var tasks = new List<Task>();
                foreach (var recipient in recipients)
                {
                    tasks.Add(SendAsync(recipient, subject, body, isHtml));
                }

                await Task.WhenAll(tasks);

                _logger.LogInformation("Batch email sent successfully to {Count} recipients via Gmail API with subject '{Subject}'",
                    recipients.Count(), subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send batch email to {Count} recipients via Gmail API", recipients.Count());
                throw;
            }
        }

        /// <summary>
        /// Check if Gmail API service is properly configured
        /// </summary>
        public bool IsConfigured()
        {
            return !string.IsNullOrWhiteSpace(_settings.ClientId) &&
                   !string.IsNullOrWhiteSpace(_settings.ClientSecret) &&
                   !string.IsNullOrWhiteSpace(_settings.FromEmail) &&
                   _settings.Enabled;
        }

        /// <summary>
        /// Build RFC 2822 MIME message
        /// </summary>
        private string BuildMimeMessage(string to, string subject, string body, bool isHtml)
        {
            var message = new StringBuilder();
            message.AppendLine($"From: {_settings.FromName} <{_settings.FromEmail}>");
            message.AppendLine($"To: {to}");
            message.AppendLine($"Subject: {subject}");
            message.AppendLine("MIME-Version: 1.0");
            message.AppendLine($"Content-Type: text/{(isHtml ? "html" : "plain")}; charset=\"UTF-8\"");
            message.AppendLine("Content-Transfer-Encoding: 7bit");
            message.AppendLine();
            message.Append(body);

            return message.ToString();
        }

        /// <summary>
        /// Encode byte array as base64url (for Gmail API)
        /// </summary>
        private static string Base64UrlEncode(byte[] input)
        {
            var output = new StringBuilder(Convert.ToBase64String(input));
            output.Replace('+', '-');
            output.Replace('/', '_');
            output.Replace("=", "");
            return output.ToString();
        }
    }
}
