using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace CueFinder.Extensions.Logging;

/// <summary>
/// Extensions for structured logging
/// </summary>
public static class LoggingExtensions
{
    /// <summary>
    /// Logs the start of a method execution
    /// </summary>
    public static void LogMethodEntry(
        this ILogger logger,
        string methodName,
        object? parameters = null)
    {
        if (parameters != null)
        {
            logger.LogDebug("Entering {MethodName} with parameters: {@Parameters}", 
                methodName, parameters);
        }
        else
        {
            logger.LogDebug("Entering {MethodName}", methodName);
        }
    }

    /// <summary>
    /// Logs the end of a method execution
    /// </summary>
    public static void LogMethodExit(
        this ILogger logger,
        string methodName,
        object? result = null)
    {
        if (result != null)
        {
            logger.LogDebug("Exiting {MethodName} with result: {@Result}", 
                methodName, result);
        }
        else
        {
            logger.LogDebug("Exiting {MethodName}", methodName);
        }
    }

    /// <summary>
    /// Logs method execution with automatic timing
    /// </summary>
    public static async Task<T> LogExecutionTimeAsync<T>(
        this ILogger logger,
        string methodName,
        Func<Task<T>> action)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            logger.LogDebug("Starting {MethodName}", methodName);
            var result = await action();
            stopwatch.Stop();
            
            logger.LogInformation(
                "{MethodName} completed successfully in {ElapsedMilliseconds}ms",
                methodName,
                stopwatch.ElapsedMilliseconds);
            
            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogError(
                ex,
                "{MethodName} failed after {ElapsedMilliseconds}ms",
                methodName,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    /// <summary>
    /// Logs method execution with automatic timing (synchronous)
    /// </summary>
    public static T LogExecutionTime<T>(
        this ILogger logger,
        string methodName,
        Func<T> action)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            logger.LogDebug("Starting {MethodName}", methodName);
            var result = action();
            stopwatch.Stop();
            
            logger.LogInformation(
                "{MethodName} completed successfully in {ElapsedMilliseconds}ms",
                methodName,
                stopwatch.ElapsedMilliseconds);
            
            return result;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogError(
                ex,
                "{MethodName} failed after {ElapsedMilliseconds}ms",
                methodName,
                stopwatch.ElapsedMilliseconds);
            throw;
        }
    }

    /// <summary>
    /// Logs user action with context
    /// </summary>
    public static void LogUserAction(
        this ILogger logger,
        int userId,
        string action,
        object? details = null)
    {
        if (details != null)
        {
            logger.LogInformation(
                "User {UserId} performed action: {Action} with details: {@Details}",
                userId,
                action,
                details);
        }
        else
        {
            logger.LogInformation(
                "User {UserId} performed action: {Action}",
                userId,
                action);
        }
    }

    /// <summary>
    /// Logs security event
    /// </summary>
    public static void LogSecurityEvent(
        this ILogger logger,
        string eventType,
        int? userId = null,
        string? details = null)
    {
        if (userId.HasValue)
        {
            logger.LogWarning(
                "Security Event: {EventType} for User {UserId}. Details: {Details}",
                eventType,
                userId.Value,
                details ?? "No additional details");
        }
        else
        {
            logger.LogWarning(
                "Security Event: {EventType}. Details: {Details}",
                eventType,
                details ?? "No additional details");
        }
    }

    /// <summary>
    /// Logs database operation
    /// </summary>
    public static void LogDatabaseOperation(
        this ILogger logger,
        string operation,
        string entity,
        object? parameters = null)
    {
        if (parameters != null)
        {
            logger.LogDebug(
                "Database {Operation} on {Entity} with parameters: {@Parameters}",
                operation,
                entity,
                parameters);
        }
        else
        {
            logger.LogDebug(
                "Database {Operation} on {Entity}",
                operation,
                entity);
        }
    }

    /// <summary>
    /// Logs external API call
    /// </summary>
    public static void LogExternalApiCall(
        this ILogger logger,
        string apiName,
        string endpoint,
        string method = "GET")
    {
        logger.LogInformation(
            "Calling external API: {ApiName} - {Method} {Endpoint}",
            apiName,
            method,
            endpoint);
    }

    /// <summary>
    /// Logs cache operation
    /// </summary>
    public static void LogCacheOperation(
        this ILogger logger,
        string operation,
        string key,
        bool success = true)
    {
        if (success)
        {
            logger.LogDebug(
                "Cache {Operation} for key: {CacheKey} - Success",
                operation,
                key);
        }
        else
        {
            logger.LogWarning(
                "Cache {Operation} for key: {CacheKey} - Failed",
                operation,
                key);
        }
    }

    /// <summary>
    /// Logs validation error
    /// </summary>
    public static void LogValidationError(
        this ILogger logger,
        string field,
        string error,
        object? value = null)
    {
        if (value != null)
        {
            logger.LogWarning(
                "Validation error on field {Field}: {Error}. Value: {@Value}",
                field,
                error,
                value);
        }
        else
        {
            logger.LogWarning(
                "Validation error on field {Field}: {Error}",
                field,
                error);
        }
    }

    /// <summary>
    /// Logs business rule violation
    /// </summary>
    public static void LogBusinessRuleViolation(
        this ILogger logger,
        string rule,
        string details,
        int? userId = null)
    {
        if (userId.HasValue)
        {
            logger.LogWarning(
                "Business rule violation: {Rule} by User {UserId}. Details: {Details}",
                rule,
                userId.Value,
                details);
        }
        else
        {
            logger.LogWarning(
                "Business rule violation: {Rule}. Details: {Details}",
                rule,
                details);
        }
    }
}
