using CueFinder.BilliardTables.Interfaces;
using CueFinder.BilliardTables.Services;
using CueFinder.BilliardTables.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.BilliardTables.Extensions;

/// <summary>
/// Extension methods for registering BilliardTables library services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add BilliardTables services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddBilliardTablesServices(this IServiceCollection services)
    {
        // Register controllers
        services.TryAddScoped<BilliardTablesController>();

        // Register services
        services.AddScoped<IBilliardTableService, BilliardTableService>();
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
