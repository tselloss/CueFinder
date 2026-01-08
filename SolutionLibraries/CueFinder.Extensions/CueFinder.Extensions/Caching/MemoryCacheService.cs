using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace CueFinder.Extensions.Caching;

/// <summary>
/// In-memory implementation of the cache service
/// </summary>
public class MemoryCacheService : ICacheService
{
    private readonly IMemoryCache _cache;
    private readonly ILogger<MemoryCacheService> _logger;
    private readonly CacheOptions _options;
    private readonly ConcurrentDictionary<string, byte> _cacheKeys;
    private readonly CacheStatistics _statistics;

    public MemoryCacheService(
        IMemoryCache cache,
        ILogger<MemoryCacheService> logger,
        IOptions<CacheOptions> options)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _cacheKeys = new ConcurrentDictionary<string, byte>();
        _statistics = new CacheStatistics();
    }

    public Task<T?> GetAsync<T>(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (!_options.EnableCaching)
            return Task.FromResult<T?>(default);

        try
        {
            if (_cache.TryGetValue(key, out T? value))
            {
                _logger.LogDebug("Cache hit for key: {Key}", key);
                _statistics.RecordHit();
                return Task.FromResult(value);
            }

            _logger.LogDebug("Cache miss for key: {Key}", key);
            _statistics.RecordMiss();
            return Task.FromResult<T?>(default);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting value from cache for key: {Key}", key);
            return Task.FromResult<T?>(default);
        }
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (!_options.EnableCaching)
            return Task.CompletedTask;

        try
        {
            var cacheEntryOptions = new MemoryCacheEntryOptions();

            if (absoluteExpiration.HasValue)
            {
                cacheEntryOptions.SetAbsoluteExpiration(absoluteExpiration.Value);
            }
            else if (_options.DefaultAbsoluteExpirationMinutes > 0)
            {
                cacheEntryOptions.SetAbsoluteExpiration(TimeSpan.FromMinutes(_options.DefaultAbsoluteExpirationMinutes));
            }

            if (slidingExpiration.HasValue)
            {
                cacheEntryOptions.SetSlidingExpiration(slidingExpiration.Value);
            }
            else if (_options.DefaultSlidingExpirationMinutes.HasValue)
            {
                cacheEntryOptions.SetSlidingExpiration(TimeSpan.FromMinutes(_options.DefaultSlidingExpirationMinutes.Value));
            }

            // Register callback to remove key from tracking
            cacheEntryOptions.RegisterPostEvictionCallback((cacheKey, cacheValue, reason, state) =>
            {
                _cacheKeys.TryRemove(cacheKey.ToString()!, out _);
                _logger.LogDebug("Cache entry evicted. Key: {Key}, Reason: {Reason}", cacheKey, reason);
            });

            _cache.Set(key, value, cacheEntryOptions);
            _cacheKeys.TryAdd(key, 0);
            _statistics.RecordSet();

            _logger.LogDebug("Value cached for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting value in cache for key: {Key}", key);
        }

        return Task.CompletedTask;
    }

    public async Task<T> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? absoluteExpiration = null, TimeSpan? slidingExpiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        if (factory == null)
            throw new ArgumentNullException(nameof(factory));

        if (!_options.EnableCaching)
            return await factory();

        var cachedValue = await GetAsync<T>(key);
        if (cachedValue != null)
            return cachedValue;

        try
        {
            var value = await factory();
            await SetAsync(key, value, absoluteExpiration, slidingExpiration);
            return value;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating value for cache key: {Key}", key);
            throw;
        }
    }

    public Task RemoveAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        try
        {
            _cache.Remove(key);
            _cacheKeys.TryRemove(key, out _);
            _logger.LogDebug("Cache entry removed for key: {Key}", key);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing value from cache for key: {Key}", key);
        }

        return Task.CompletedTask;
    }

    public Task RemoveByPatternAsync(string pattern)
    {
        if (string.IsNullOrWhiteSpace(pattern))
            throw new ArgumentException("Pattern cannot be null or empty", nameof(pattern));

        try
        {
            var regex = new Regex(pattern.Replace("*", ".*"), RegexOptions.IgnoreCase);
            var keysToRemove = _cacheKeys.Keys.Where(k => regex.IsMatch(k)).ToList();

            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                _cacheKeys.TryRemove(key, out _);
            }

            _logger.LogDebug("Removed {Count} cache entries matching pattern: {Pattern}", keysToRemove.Count, pattern);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error removing cache entries by pattern: {Pattern}", pattern);
        }

        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
            throw new ArgumentException("Cache key cannot be null or empty", nameof(key));

        try
        {
            return Task.FromResult(_cache.TryGetValue(key, out _));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if key exists in cache: {Key}", key);
            return Task.FromResult(false);
        }
    }

    public Task ClearAsync()
    {
        try
        {
            var keys = _cacheKeys.Keys.ToList();
            foreach (var key in keys)
            {
                _cache.Remove(key);
                _cacheKeys.TryRemove(key, out _);
            }

            _logger.LogInformation("Cache cleared. Removed {Count} entries", keys.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing cache");
        }

        return Task.CompletedTask;
    }

    /// <summary>
    /// Gets cache statistics if enabled
    /// </summary>
    public CacheStatistics GetStatistics() => _statistics;
}
