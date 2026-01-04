using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace CueFinder.Auth.Extensions
{
    public static class AuthServiceExtension
    {
        public static IServiceCollection AddAuthServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register DatabaseAuthService instead of mock AuthService
            services.AddScoped<IAuthService, DatabaseAuthService>();
            services.AddScoped<ITokenService, TokenService>();
            
            // Register SMS and Phone Verification services
            services.AddHttpClient<ISmsService, SmsService>(); // This registers both ISmsService and HttpClient
            services.AddScoped<IPhoneVerificationService, PhoneVerificationService>();

            // Configure JWT Authentication
            var jwtSettings = configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"];
            var issuer = jwtSettings["Issuer"];
            var audience = jwtSettings["Audience"];

            // Validate JWT configuration
            if (string.IsNullOrEmpty(secretKey) || secretKey.Length < 32)
            {
                throw new InvalidOperationException(
                    "JWT SecretKey is missing or too short (must be at least 32 characters). " +
                    "Configure it in appsettings.json under JwtSettings:SecretKey");
            }

            // Register authentication scheme
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = issuer,
                    ValidateAudience = true,
                    ValidAudience = audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };
            });

            // Register authorization
            services.AddAuthorization();

            return services;
        }
    }
}