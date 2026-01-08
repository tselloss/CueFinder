using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CueFinder.Extensions.Caching;

/// <summary>
/// Extension methods for setting up caching services
/// </summary>
public static class ServiceCollectionExtensions
{
    /// <summary>
    /// Adds caching services to the service collection
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configuration">Configuration containing cache options</param>
    /// <param name="sectionName">Configuration section name (default: "Caching")</param>
    public static IServiceCollection AddCueFinderCaching(
        this IServiceCollection services,
        IConfiguration configuration,
        string sectionName = "Caching")
    {
        // Configure options
        var configSection = configuration.GetSection(sectionName);
        services.Configure<CacheOptions>(configSection);

        // Add memory cache
        services.AddMemoryCache(options =>
        {
            var cacheOptions = configSection.Get<CacheOptions>();
            if (cacheOptions?.MaxCacheSize.HasValue == true)
            {
                options.SizeLimit = cacheOptions.MaxCacheSize.Value;
            }
        });

        // Register cache service
        services.AddSingleton<ICacheService, MemoryCacheService>();

        return services;
    }

    /// <summary>
    /// Adds caching services with custom options
    /// </summary>
    /// <param name="services">The service collection</param>
    /// <param name="configureOptions">Action to configure cache options</param>
    public static IServiceCollection AddCueFinderCaching(
        this IServiceCollection services,
        Action<CacheOptions> configureOptions)
    {
        // Configure options
        services.Configure(configureOptions);

        var options = new CacheOptions();
        configureOptions(options);

        // Add memory cache
        services.AddMemoryCache(memoryCacheOptions =>
        {
            if (options.MaxCacheSize.HasValue)
            {
                memoryCacheOptions.SizeLimit = options.MaxCacheSize.Value;
            }
        });

        // Register cache service
        services.AddSingleton<ICacheService, MemoryCacheService>();

        return services;
    }

    /// <summary>
    /// Adds caching services with default options
    /// </summary>
    /// <param name="services">The service collection</param>
    public static IServiceCollection AddCueFinderCaching(this IServiceCollection services)
    {
        // Configure default options
        services.Configure<CacheOptions>(options => { });

        // Add memory cache
        services.AddMemoryCache();

        // Register cache service
        services.AddSingleton<ICacheService, MemoryCacheService>();

        return services;
    }
}
