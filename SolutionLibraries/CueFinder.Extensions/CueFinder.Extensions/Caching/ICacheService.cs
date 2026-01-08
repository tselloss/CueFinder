namespace CueFinder.Extensions.Caching;

/// <summary>
/// Interface for cache service operations
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Gets a value from cache by key
    /// </summary>
    /// <typeparam name="T">Type of the cached value</typeparam>
    /// <param name="key">Cache key</param>
    /// <returns>Cached value or default if not found</returns>
    Task<T?> GetAsync<T>(string key);

    /// <summary>
    /// Sets a value in cache with optional expiration
    /// </summary>
    /// <typeparam name="T">Type of the value to cache</typeparam>
    /// <param name="key">Cache key</param>
    /// <param name="value">Value to cache</param>
    /// <param name="absoluteExpiration">Absolute expiration time (optional)</param>
    /// <param name="slidingExpiration">Sliding expiration time (optional)</param>
    Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null);

    /// <summary>
    /// Gets a value from cache or creates it using the factory function if not found
    /// </summary>
    /// <typeparam name="T">Type of the cached value</typeparam>
    /// <param name="key">Cache key</param>
    /// <param name="factory">Factory function to create the value if not cached</param>
    /// <param name="absoluteExpiration">Absolute expiration time (optional)</param>
    /// <param name="slidingExpiration">Sliding expiration time (optional)</param>
    Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null);

    /// <summary>
    /// Removes a value from cache by key
    /// </summary>
    /// <param name="key">Cache key</param>
    Task RemoveAsync(string key);

    /// <summary>
    /// Removes all values from cache that match the pattern
    /// </summary>
    /// <param name="pattern">Pattern to match keys (supports wildcards)</param>
    Task RemoveByPatternAsync(string pattern);

    /// <summary>
    /// Checks if a key exists in cache
    /// </summary>
    /// <param name="key">Cache key</param>
    Task<bool> ExistsAsync(string key);

    /// <summary>
    /// Clears all items from the cache
    /// </summary>
    Task ClearAsync();
}
