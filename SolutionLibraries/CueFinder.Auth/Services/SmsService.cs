using CueFinder.Auth.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Net.Http;
using System.Text;
using System.Text.Json;

namespace CueFinder.Auth.Services
{
    /// <summary>
    /// SMS/Viber service implementation for sending verification codes and magic links
    /// Supports multiple providers: Twilio, Viber, generic SMS gateway
    /// </summary>
    public class SmsService : ISmsService
    {
        private readonly ILogger<SmsService> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;
        private readonly string _provider;
        private readonly string _smsApiUrl;
        private readonly string _viberApiUrl;
        private readonly string _apiKey;
        private readonly string _senderId;

        public SmsService(
            ILogger<SmsService> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;

            // Read configuration
            _provider = _configuration["Sms:Provider"] ?? "Mock";
            _smsApiUrl = _configuration["Sms:ApiUrl"] ?? "";
            _viberApiUrl = _configuration["Viber:ApiUrl"] ?? "";
            _apiKey = _configuration["Sms:ApiKey"] ?? "";
            _senderId = _configuration["Sms:SenderId"] ?? "CueFinder";
        }

        /// <summary>
        /// Send verification code via SMS
        /// </summary>
        public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string code, string method = "SMS")
        {
            try
            {
                _logger.LogInformation("Sending {Method} verification code to {Phone}", method, phoneNumber);

                var message = $"Your CueFinder verification code is: {code}\n\nThis code expires in 15 minutes.\n\nIf you didn't request this code, please ignore this message.";

                if (_provider == "Mock" || string.IsNullOrEmpty(_apiKey))
                {
                    // Development/Testing mode
                    _logger.LogWarning("SMS Service in Mock mode. Code would be sent: {Code} to {Phone}", code, phoneNumber);
                    Console.WriteLine($"══════════════════════════════════");
                    Console.WriteLine($"📱 VERIFICATION CODE");
                    Console.WriteLine($"Phone: {phoneNumber}");
                    Console.WriteLine($"Code: {code}");
                    Console.WriteLine($"Method: {method}");
                    Console.WriteLine($"══════════════════════════════════");
                    return true;
                }

                // Send via configured provider
                return method.ToUpper() == "VIBER" 
                    ? await SendViberMessageAsync(phoneNumber, message)
                    : await SendSmsMessageAsync(phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification code to {Phone}", phoneNumber);
                return false;
            }
        }

        /// <summary>
        /// Send magic link via SMS/Viber
        /// </summary>
        public async Task<bool> SendMagicLinkAsync(string phoneNumber, string magicLink, string method = "Viber")
        {
            try
            {
                _logger.LogInformation("Sending {Method} magic link to {Phone}", method, phoneNumber);

                var message = $"🔐 CueFinder Verification\n\nClick to verify your account:\n{magicLink}\n\nLink expires in 15 minutes.\n\nIf you didn't request this, please ignore.";

                if (_provider == "Mock" || string.IsNullOrEmpty(_apiKey))
                {
                    // Development/Testing mode
                    _logger.LogWarning("SMS Service in Mock mode. Magic link would be sent: {Link} to {Phone}", magicLink, phoneNumber);
                    Console.WriteLine($"══════════════════════════════════");
                    Console.WriteLine($"🔗 MAGIC LINK");
                    Console.WriteLine($"Phone: {phoneNumber}");
                    Console.WriteLine($"Link: {magicLink}");
                    Console.WriteLine($"Method: {method}");
                    Console.WriteLine($"══════════════════════════════════");
                    return true;
                }

                return method.ToUpper() == "VIBER"
                    ? await SendViberMessageAsync(phoneNumber, message)
                    : await SendSmsMessageAsync(phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send magic link to {Phone}", phoneNumber);
                return false;
            }
        }

        /// <summary>
        /// Send verification code and magic link together
        /// </summary>
        public async Task<bool> SendVerificationWithLinkAsync(string phoneNumber, string code, string magicLink, string method = "Viber")
        {
            try
            {
                _logger.LogInformation("Sending {Method} verification with link to {Phone}", method, phoneNumber);

                var message = $"🔐 CueFinder Verification\n\n" +
                             $"Code: {code}\n\n" +
                             $"Or click to verify:\n{magicLink}\n\n" +
                             $"Expires in 15 minutes.";

                if (_provider == "Mock" || string.IsNullOrEmpty(_apiKey))
                {
                    // Development/Testing mode
                    _logger.LogWarning("SMS Service in Mock mode. Code: {Code}, Link: {Link} to {Phone}", 
                        code, magicLink, phoneNumber);
                    Console.WriteLine($"══════════════════════════════════");
                    Console.WriteLine($"📱 VERIFICATION CODE & LINK");
                    Console.WriteLine($"Phone: {phoneNumber}");
                    Console.WriteLine($"Code: {code}");
                    Console.WriteLine($"Link: {magicLink}");
                    Console.WriteLine($"Method: {method}");
                    Console.WriteLine($"══════════════════════════════════");
                    return true;
                }

                return method.ToUpper() == "VIBER"
                    ? await SendViberMessageAsync(phoneNumber, message)
                    : await SendSmsMessageAsync(phoneNumber, message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send verification with link to {Phone}", phoneNumber);
                return false;
            }
        }

        /// <summary>
        /// Send SMS via configured SMS gateway
        /// </summary>
        private async Task<bool> SendSmsMessageAsync(string phoneNumber, string message)
        {
            try
            {
                // Generic SMS gateway implementation
                // Adapt this to your SMS provider (Twilio, Nexmo, etc.)
                
                var payload = new
                {
                    to = phoneNumber,
                    from = _senderId,
                    message = message,
                    api_key = _apiKey
                };

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync(_smsApiUrl, content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("SMS sent successfully to {Phone}", phoneNumber);
                    return true;
                }

                _logger.LogWarning("SMS gateway returned {StatusCode} for {Phone}", 
                    response.StatusCode, phoneNumber);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending SMS to {Phone}", phoneNumber);
                return false;
            }
        }

        /// <summary>
        /// Send message via Viber
        /// </summary>
        private async Task<bool> SendViberMessageAsync(string phoneNumber, string message)
        {
            try
            {
                // Viber Business Messages API implementation
                // This is a simplified example - adapt to your Viber API
                
                var payload = new
                {
                    receiver = phoneNumber,
                    min_api_version = 1,
                    sender = new
                    {
                        name = "CueFinder"
                    },
                    type = "text",
                    text = message
                };

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("X-Viber-Auth-Token", _apiKey);

                var content = new StringContent(
                    JsonSerializer.Serialize(payload),
                    Encoding.UTF8,
                    "application/json");

                var response = await _httpClient.PostAsync(_viberApiUrl, content);
                
                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation("Viber message sent successfully to {Phone}", phoneNumber);
                    return true;
                }

                _logger.LogWarning("Viber API returned {StatusCode} for {Phone}", 
                    response.StatusCode, phoneNumber);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending Viber message to {Phone}", phoneNumber);
                return false;
            }
        }
    }
}
