using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Net;
using System.Threading.Tasks;

namespace CueFinder.Auth.Middleware
{
    /// <summary>
    /// Rate limiting middleware to prevent brute force attacks
    /// </summary>
    public class RateLimitingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly IMemoryCache _cache;
        private readonly int _requestLimit;
        private readonly TimeSpan _timeWindow;

        public RateLimitingMiddleware(
            RequestDelegate next, 
            IMemoryCache cache,
            int requestLimit = 5,
            int timeWindowSeconds = 60)
        {
            _next = next;
            _cache = cache;
            _requestLimit = requestLimit;
            _timeWindow = TimeSpan.FromSeconds(timeWindowSeconds);
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only apply rate limiting to login endpoint
            if (context.Request.Path.StartsWithSegments("/api/auth/login") && 
                context.Request.Method == "POST")
            {
                var clientIp = GetClientIp(context);
                var cacheKey = $"RateLimit_{clientIp}";

                if (_cache.TryGetValue<RateLimitInfo>(cacheKey, out var rateLimitInfo))
                {
                    if (rateLimitInfo.RequestCount >= _requestLimit)
                    {
                        // Rate limit exceeded
                        var retryAfter = (int)(rateLimitInfo.ExpiresAt - DateTime.UtcNow).TotalSeconds;
                        context.Response.StatusCode = (int)HttpStatusCode.TooManyRequests;
                        context.Response.Headers.Add("Retry-After", retryAfter.ToString());
                        context.Response.ContentType = "application/json";
                        
                        await context.Response.WriteAsJsonAsync(new 
                        { 
                            message = $"Too many login attempts. Please try again in {retryAfter} seconds.",
                            retryAfter = retryAfter
                        });
                        
                        return;
                    }

                    // Increment request count
                    rateLimitInfo.RequestCount++;
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpiration = rateLimitInfo.ExpiresAt,
                        Size = 1
                    };
                    _cache.Set(cacheKey, rateLimitInfo, cacheOptions);
                }
                else
                {
                    // First request in the time window
                    var expiresAt = DateTime.UtcNow.Add(_timeWindow);
                    var cacheOptions = new MemoryCacheEntryOptions
                    {
                        AbsoluteExpiration = expiresAt,
                        Size = 1
                    };
                    _cache.Set(cacheKey, new RateLimitInfo 
                    { 
                        RequestCount = 1, 
                        ExpiresAt = expiresAt 
                    }, cacheOptions);
                }
            }

            await _next(context);
        }

        private string GetClientIp(HttpContext context)
        {
            // Check for X-Forwarded-For header (proxy/load balancer)
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            if (!string.IsNullOrEmpty(forwardedFor))
            {
                var ips = forwardedFor.Split(',');
                return ips[0].Trim();
            }

            // Check for X-Real-IP header
            var realIp = context.Request.Headers["X-Real-IP"].FirstOrDefault();
            if (!string.IsNullOrEmpty(realIp))
            {
                return realIp;
            }

            // Fall back to RemoteIpAddress
            return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        }

        private class RateLimitInfo
        {
            public int RequestCount { get; set; }
            public DateTime ExpiresAt { get; set; }
        }
    }

    /// <summary>
    /// Extension method to add rate limiting middleware
    /// </summary>
    public static class RateLimitingMiddlewareExtensions
    {
        public static IApplicationBuilder UseRateLimiting(
            this IApplicationBuilder builder,
            int requestLimit = 5,
            int timeWindowSeconds = 60)
        {
            return builder.UseMiddleware<RateLimitingMiddleware>(requestLimit, timeWindowSeconds);
        }
    }
}
