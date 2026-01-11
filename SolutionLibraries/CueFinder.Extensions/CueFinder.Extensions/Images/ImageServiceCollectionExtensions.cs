using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CueFinder.Extensions.Images;

/// <summary>
/// DI helpers for image storage.
/// </summary>
public static class ImageServiceCollectionExtensions
{
    public static IServiceCollection AddCueFinderImageServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<ImageStorageSettings>(configuration.GetSection("ImageStorage"));
        services.AddScoped<IImageService, ImageService>();
        return services;
    }
}
