using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Extension methods for registering email services
    /// </summary>
    public static class EmailServiceExtension
    {
        /// <summary>
        /// Register email service with dependency injection
        /// </summary>
        public static IServiceCollection AddEmailService(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Bind email settings from configuration
            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));

            // Bind Gmail API settings (if available)
            services.Configure<GmailApiSettings>(configuration.GetSection("GmailApi"));

            // Register email service based on configuration
            var gmailApiConfig = configuration.GetSection("GmailApi");
            if (gmailApiConfig.Exists() && gmailApiConfig.GetValue<bool>("Enabled"))
            {
                // Use Gmail API service
                services.AddScoped<IEmailService, GmailApiEmailService>();
            }
            else
            {
                // Use SMTP service (default)
                services.AddScoped<IEmailService, EmailService>();
            }

            return services;
        }
    }
}
