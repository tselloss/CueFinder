using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Gmail.v1;
using Google.Apis.Gmail.v1.Data;
using Google.Apis.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Email service implementation using Gmail API v1
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
        /// Send an email to a single recipient
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
                var message = CreateMimeMessage(_settings.FromEmail, _settings.FromName, to, subject, body, isHtml);
                var gmailMessage = EncodeMessage(message);

                var service = await CreateGmailServiceAsync();
                var request = service.Users.Messages.Send(gmailMessage, "me");
                await request.ExecuteAsync();

                _logger.LogInformation("Email sent successfully via Gmail API to {To} with subject '{Subject}'", to, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send email via Gmail API to {To}", to);
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
                _logger.LogWarning("Gmail API service is not configured. Batch email not sent.");
                return;
            }

            var recipientList = recipients.ToList();
            if (!recipientList.Any())
            {
                _logger.LogWarning("No recipients provided for batch email.");
                return;
            }

            try
            {
                var service = await CreateGmailServiceAsync();

                // Send emails individually as Gmail API doesn't have a native batch send with multiple "To" recipients in one message
                // For true batch functionality, we would send individual emails to each recipient
                foreach (var recipient in recipientList)
                {
                    try
                    {
                        var message = CreateMimeMessage(_settings.FromEmail, _settings.FromName, recipient, subject, body, isHtml);
                        var gmailMessage = EncodeMessage(message);

                        var request = service.Users.Messages.Send(gmailMessage, "me");
                        await request.ExecuteAsync();

                        _logger.LogInformation("Batch email sent successfully via Gmail API to {To}", recipient);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send batch email via Gmail API to {To}", recipient);
                        // Continue sending to other recipients even if one fails
                    }
                }

                _logger.LogInformation("Batch email process completed. Sent to {Count} recipients with subject '{Subject}'", 
                    recipientList.Count, subject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send batch email via Gmail API to {Count} recipients", recipientList.Count);
                throw;
            }
        }

        /// <summary>
        /// Check if Gmail API service is properly configured
        /// </summary>
        public bool IsConfigured()
        {
            // Check if credentials file path or JSON content is provided
            var hasCredentials = !string.IsNullOrWhiteSpace(_settings.ServiceAccountCredentialsJson) ||
                                 !string.IsNullOrWhiteSpace(_settings.ServiceAccountCredentialsPath);

            return hasCredentials && !string.IsNullOrWhiteSpace(_settings.FromEmail);
        }

        /// <summary>
        /// Create Gmail service instance with authentication
        /// </summary>
        private async Task<GmailService> CreateGmailServiceAsync()
        {
            GoogleCredential credential;

            // Load credentials from JSON content or file path
            if (!string.IsNullOrWhiteSpace(_settings.ServiceAccountCredentialsJson))
            {
                credential = GoogleCredential.FromJson(_settings.ServiceAccountCredentialsJson);
            }
            else if (!string.IsNullOrWhiteSpace(_settings.ServiceAccountCredentialsPath))
            {
                using (var stream = System.IO.File.OpenRead(_settings.ServiceAccountCredentialsPath))
                {
                    credential = await GoogleCredential.FromStreamAsync(stream, System.Threading.CancellationToken.None);
                }
            }
            else
            {
                throw new InvalidOperationException("Gmail API credentials not configured.");
            }

            // If using service account with domain-wide delegation, specify the user to impersonate
            if (!string.IsNullOrWhiteSpace(_settings.ImpersonateUser))
            {
                credential = credential.CreateScoped(GmailService.Scope.GmailSend)
                                      .CreateWithUser(_settings.ImpersonateUser);
            }
            else
            {
                credential = credential.CreateScoped(GmailService.Scope.GmailSend);
            }

            var service = new GmailService(new BaseClientService.Initializer()
            {
                HttpClientInitializer = credential,
                ApplicationName = _settings.ApplicationName ?? "CueFinder"
            });

            return service;
        }

        /// <summary>
        /// Create a MIME message using MimeKit
        /// </summary>
        private MimeMessage CreateMimeMessage(string fromEmail, string fromName, string to, string subject, string body, bool isHtml)
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(MailboxAddress.Parse(to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder();
            if (isHtml)
            {
                bodyBuilder.HtmlBody = body;
            }
            else
            {
                bodyBuilder.TextBody = body;
            }

            message.Body = bodyBuilder.ToMessageBody();
            return message;
        }

        /// <summary>
        /// Encode MimeMessage to Gmail API Message format
        /// </summary>
        private Message EncodeMessage(MimeMessage message)
        {
            using (var stream = new System.IO.MemoryStream())
            {
                message.WriteTo(stream);
                var raw = Convert.ToBase64String(stream.ToArray())
                    .Replace('+', '-')
                    .Replace('/', '_')
                    .Replace("=", "");

                return new Message { Raw = raw };
            }
        }
    }
}
