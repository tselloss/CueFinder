using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using CueFinder.Extensions.ProblemDetails;
using CueFinder.Extensions.Authentication;
using CueFinder.Extensions.Caching;

namespace CueFinder.Extensions;

/// <summary>
/// Main service collection extensions for CueFinder.Extensions
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds all CueFinder extensions to the service collection
    /// </summary>
    public static IServiceCollection AddCueFinderExtensions(
        this IServiceCollection services,
        IConfiguration configuration,
        bool includeExceptionDetails = false)
    {
        // Add ProblemDetails
        services.AddCueFinderProblemDetails(includeExceptionDetails);

        // Add JWT Authentication (if configured)
        var jwtSettings = configuration.GetSection("JwtSettings");
        if (jwtSettings.Exists() && !string.IsNullOrEmpty(jwtSettings["SecretKey"]))
        {
            services.AddCueFinderJwtAuthentication(configuration);
        }

        // Add Caching services (if configured)
        var cacheSettings = configuration.GetSection("CacheSettings");
        if (cacheSettings.Exists())
        {
            services.AddCueFinderCaching(configuration);
        }

        return services;
    }
}
