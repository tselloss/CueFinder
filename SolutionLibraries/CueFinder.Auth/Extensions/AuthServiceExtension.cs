using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Services;
using CueFinder.Auth.Controllers;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.Tasks;

namespace CueFinder.Auth.Extensions
{
    public static class AuthServiceExtension
    {
        public static IServiceCollection AddAuthServices(this IServiceCollection services, IConfiguration configuration)
        {
            // Register controllers
            services.TryAddScoped<AuthController>();
            services.TryAddScoped<SellersController>();
            services.TryAddScoped<UsersController>();

            // Register DatabaseAuthService instead of mock AuthService
            services.AddScoped<IAuthService, DatabaseAuthService>();
            services.AddScoped<ITokenService, TokenService>();
            services.AddScoped<IPasswordResetService, PasswordResetService>();
            
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
                // .NET 8 uses JsonWebTokenHandler which defaults MapInboundClaims to false.
                // Ensure JWT short claims ("sub", "nameid") are mapped back to ClaimTypes.
                options.MapInboundClaims = true;

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

                // Allow JWT tokens to flow to SignalR hubs via query string
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;

                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/messages"))
                        {
                            context.Token = accessToken;
                        }

                        return Task.CompletedTask;
                    }
                };
            });

            // Register authorization
            services.AddAuthorization();

            return services;
        }
    }
}