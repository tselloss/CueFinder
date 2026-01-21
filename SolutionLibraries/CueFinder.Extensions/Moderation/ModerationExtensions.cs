using CueFinder.Extensions.Moderation;
using Microsoft.Extensions.DependencyInjection;

namespace CueFinder.Extensions.Moderation
{
    /// <summary>
    /// Extension methods for moderation services
    /// </summary>
    public static class ModerationExtensions
    {
        /// <summary>
        /// Add moderation services to the service collection
        /// </summary>
        public static IServiceCollection AddModerationServices(this IServiceCollection services)
        {
            services.AddScoped<IModerationService, ModerationService>();
            services.AddHttpClient();
            return services;
        }
    }
}
