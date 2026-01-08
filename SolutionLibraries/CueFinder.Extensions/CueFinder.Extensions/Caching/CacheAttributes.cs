using System.Reflection;

namespace CueFinder.Extensions.Caching;

/// <summary>
/// Attribute to mark methods for automatic caching
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
public class CacheableAttribute : Attribute
{
    /// <summary>
    /// Cache key prefix. If not specified, method name will be used
    /// </summary>
    public string? KeyPrefix { get; set; }

    /// <summary>
    /// Absolute expiration in minutes
    /// </summary>
    public int? AbsoluteExpirationMinutes { get; set; }

    /// <summary>
    /// Sliding expiration in minutes
    /// </summary>
    public int? SlidingExpirationMinutes { get; set; }

    /// <summary>
    /// Whether to include method parameters in the cache key
    /// </summary>
    public bool IncludeParametersInKey { get; set; } = true;

    /// <summary>
    /// Gets the cache key for the method invocation
    /// </summary>
    public string GetCacheKey(MethodInfo method, object[] args)
    {
        var prefix = KeyPrefix ?? method.Name;
        
        if (!IncludeParametersInKey || args.Length == 0)
            return prefix;

        var parameterPart = string.Join(":", args.Select(a => a?.ToString() ?? "null"));
        return $"{prefix}:{parameterPart}";
    }
}

/// <summary>
/// Attribute to mark methods that should invalidate cache
/// </summary>
[AttributeUsage(AttributeTargets.Method, AllowMultiple = true)]
public class InvalidatesCacheAttribute : Attribute
{
    /// <summary>
    /// Cache key pattern to invalidate
    /// </summary>
    public string Pattern { get; set; }

    public InvalidatesCacheAttribute(string pattern)
    {
        Pattern = pattern ?? throw new ArgumentNullException(nameof(pattern));
    }
}
