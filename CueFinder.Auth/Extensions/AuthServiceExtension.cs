using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CueFinder.Auth.Extensions
{
    public static class AuthServiceExtension
    {
        public static IServiceCollection AddAuthServices(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<AuthService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<TokenService>();

            return services;
        }
    }
}