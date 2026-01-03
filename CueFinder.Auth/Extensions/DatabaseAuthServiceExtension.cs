using Microsoft.Extensions.DependencyInjection;
using CueFinder.Auth.Services;
using CueFinder.Auth.Interfaces;
using CueFinder.Database.Services;

namespace CueFinder.Auth.Extensions
{
    /// <summary>
    /// Extension methods for registering database-integrated authentication services
    /// </summary>
    public static class DatabaseAuthServiceExtension
    {
        /// <summary>
        /// Add database-integrated authentication services to dependency injection
        /// </summary>
        public static IServiceCollection AddDatabaseAuthServices(this IServiceCollection services)
        {
            // Register token service
            services.AddScoped<ITokenService, TokenService>();

            // Register database auth service (replaces in-memory AuthService)
            services.AddScoped<IAuthService, DatabaseAuthService>();

            return services;
        }

        /// <summary>
        /// Alternative: Register both services for flexibility
        /// </summary>
        public static IServiceCollection AddDualAuthServices(this IServiceCollection services)
        {
            // Register token service
            services.AddScoped<ITokenService, TokenService>();

            // Register both auth services
            services.AddScoped<IAuthService>(provider =>
                provider.GetRequiredService<DatabaseAuthService>());
            
            services.AddScoped<DatabaseAuthService>();

            // Keep in-memory service available for testing
            services.AddScoped<AuthService>();

            return services;
        }
    }
}
