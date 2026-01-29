using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;

namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Extension methods for registering email services
    /// </summary>
    public static class EmailServiceExtension
    {
        /// <summary>
        /// Register SMTP email service with dependency injection
        /// </summary>
        public static IServiceCollection AddEmailService(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Bind email settings from configuration
            services.Configure<EmailSettings>(configuration.GetSection("EmailSettings"));

            // Register email service
            services.AddScoped<IEmailService, EmailService>();

            return services;
        }

        /// <summary>
        /// Register Gmail API email service with dependency injection
        /// </summary>
        public static IServiceCollection AddGmailApiEmailService(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Bind Gmail API settings from configuration
            services.Configure<GmailApiSettings>(configuration.GetSection("GmailApiSettings"));

            // Register Gmail API email service
            services.AddScoped<IEmailService, GmailApiEmailService>();

            return services;
        }
    }
}
