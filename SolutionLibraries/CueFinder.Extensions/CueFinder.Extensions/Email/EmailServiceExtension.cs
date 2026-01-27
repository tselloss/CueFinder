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
        /// Register email service with dependency injection
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
    }
}
