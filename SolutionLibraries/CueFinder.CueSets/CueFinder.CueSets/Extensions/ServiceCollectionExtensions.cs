using CueFinder.CueSets.Interfaces;
using CueFinder.CueSets.Services;
using CueFinder.CueSets.Controllers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace CueFinder.CueSets.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddCueSetServices(this IServiceCollection services)
    {
        services.TryAddScoped<CueSetsController>();
        services.TryAddScoped<CueSetImagesController>();

        services.AddScoped<ICueSetService, CueSetService>();
        services.AddScoped<IImageService, ImageService>();

        return services;
    }
}
