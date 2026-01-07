using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Services;
using Microsoft.Extensions.DependencyInjection;

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
        services.AddScoped<ICueCaseService, CueCaseService>();
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
