using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Services;
using CueFinder.CueCases.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.CueCases.Extensions;

/// <summary>
/// Extension methods for registering CueCases library services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Add CueCases services to the dependency injection container
    /// </summary>
    public static IServiceCollection AddCueCasesServices(this IServiceCollection services)
    {
        // Register controllers
        services.TryAddScoped<CueCasesController>();
        services.TryAddScoped<ImagesController>();

        // Register services
        services.AddScoped<ICueCaseService, CueCaseService>();
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
