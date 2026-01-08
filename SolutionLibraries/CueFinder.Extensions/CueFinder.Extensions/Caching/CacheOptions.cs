namespace CueFinder.Extensions.Caching;

/// <summary>
/// Configuration options for caching
/// </summary>
public class CacheOptions
{
    /// <summary>
    /// Default absolute expiration time for cache entries (in minutes)
    /// </summary>
    public int DefaultAbsoluteExpirationMinutes { get; set; } = 60;

    /// <summary>
    /// Default sliding expiration time for cache entries (in minutes)
    /// </summary>
    public int? DefaultSlidingExpirationMinutes { get; set; } = 20;

    /// <summary>
    /// Maximum size of the cache (number of entries)
    /// </summary>
    public int? MaxCacheSize { get; set; } = 1000;

    /// <summary>
    /// Enable or disable caching globally
    /// </summary>
    public bool EnableCaching { get; set; } = true;

    /// <summary>
    /// Compression threshold in bytes - values larger than this will be compressed
    /// </summary>
    public int CompressionThreshold { get; set; } = 1024;

    /// <summary>
    /// Enable cache statistics tracking
    /// </summary>
    public bool EnableStatistics { get; set; } = false;
}
