using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Services;
using CueFinder.Accessories.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.Accessories.Extensions;

/// <summary>
/// Extension methods for registering Accessories library services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add Accessories services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddAccessoriesServices(this IServiceCollection services)
    {
        // Register controllers
        services.TryAddScoped<AccessoriesController>();

        // Register services
        services.AddScoped<IAccessoryService, AccessoryService>();
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
