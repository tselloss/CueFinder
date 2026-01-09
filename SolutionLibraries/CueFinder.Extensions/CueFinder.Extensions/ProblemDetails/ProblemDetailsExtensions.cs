using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;

namespace CueFinder.Extensions.ProblemDetails;

/// <summary>
/// Extensions for creating standardized ProblemDetails responses
/// </summary>
public static class ProblemDetailsExtensions
{
    /// <summary>
    /// Creates a ProblemDetails for validation errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateValidationProblem(
        string title,
        string detail,
        Dictionary<string, string[]>? errors = null,
        string? instance = null)
    {
        var problemDetails = new ValidationProblemDetails(errors ?? new Dictionary<string, string[]>())
        {
            Status = StatusCodes.Status400BadRequest,
            Title = title,
            Detail = detail,
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1"
        };

        problemDetails.Extensions["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString();
        return problemDetails;
    }

    /// <summary>
    /// Creates a ProblemDetails for not found errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateNotFoundProblem(
        string title,
        string detail,
        string? instance = null)
    {
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status404NotFound,
            Title = title,
            Detail = detail,
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };
    }

    /// <summary>
    /// Creates a ProblemDetails for unauthorized errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateUnauthorizedProblem(
        string title = "Unauthorized",
        string? detail = null,
        string? instance = null)
    {
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status401Unauthorized,
            Title = title,
            Detail = detail ?? "Authentication is required to access this resource",
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7235#section-3.1",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };
    }

    /// <summary>
    /// Creates a ProblemDetails for forbidden errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateForbiddenProblem(
        string title = "Forbidden",
        string? detail = null,
        string? instance = null)
    {
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status403Forbidden,
            Title = title,
            Detail = detail ?? "You do not have permission to access this resource",
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.3",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };
    }

    /// <summary>
    /// Creates a ProblemDetails for conflict errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateConflictProblem(
        string title,
        string detail,
        string? instance = null)
    {
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status409Conflict,
            Title = title,
            Detail = detail,
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };
    }

    /// <summary>
    /// Creates a ProblemDetails for internal server errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateInternalServerErrorProblem(
        string? detail = null,
        string? instance = null,
        bool includeExceptionDetails = false,
        Exception? exception = null)
    {
        var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Internal Server Error",
            Detail = detail ?? "An unexpected error occurred while processing your request",
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.1",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };

        if (includeExceptionDetails && exception != null)
        {
            problemDetails.Extensions["exceptionType"] = exception.GetType().Name;
            problemDetails.Extensions["exceptionMessage"] = exception.Message;
            problemDetails.Extensions["stackTrace"] = exception.StackTrace;
        }

        return problemDetails;
    }

    /// <summary>
    /// Creates a ProblemDetails for bad request errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateBadRequestProblem(
        string title,
        string detail,
        string? instance = null)
    {
        return new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status400BadRequest,
            Title = title,
            Detail = detail,
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };
    }

    /// <summary>
    /// Creates a ProblemDetails for service unavailable errors
    /// </summary>
    public static Microsoft.AspNetCore.Mvc.ProblemDetails CreateServiceUnavailableProblem(
        string title = "Service Unavailable",
        string? detail = null,
        string? instance = null,
        int? retryAfterSeconds = null)
    {
        var problemDetails = new Microsoft.AspNetCore.Mvc.ProblemDetails
        {
            Status = StatusCodes.Status503ServiceUnavailable,
            Title = title,
            Detail = detail ?? "The service is temporarily unavailable",
            Instance = instance,
            Type = "https://tools.ietf.org/html/rfc7231#section-6.6.4",
            Extensions =
            {
                ["traceId"] = Activity.Current?.Id ?? Guid.NewGuid().ToString()
            }
        };

        if (retryAfterSeconds.HasValue)
        {
            problemDetails.Extensions["retryAfter"] = retryAfterSeconds.Value;
        }

        return problemDetails;
    }
}
