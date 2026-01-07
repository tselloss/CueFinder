using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CueFinder.Cues.Extensions;

/// <summary>
/// Extension methods for registering CueFinder.Cues services in the DI container
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Registers all CueFinder.Cues services with the dependency injection container
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <returns>The service collection for chaining</returns>
    public static IServiceCollection AddCueServices(this IServiceCollection services)
    {
        // Register cue management service
        services.AddScoped<ICueService, CueService>();

        // Register image management service
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
