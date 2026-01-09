using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using System.Diagnostics;

namespace CueFinder.Extensions.ProblemDetails;

/// <summary>
/// Extensions for configuring ProblemDetails in the service collection
/// </summary>
public static class ProblemDetailsServiceExtensions
{
    /// <summary>
    /// Adds standardized ProblemDetails configuration to the service collection
    /// </summary>
    public static IServiceCollection AddCueFinderProblemDetails(
        this IServiceCollection services,
        bool includeExceptionDetails = false)
    {
        services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                // Add trace ID to all problem details
                context.ProblemDetails.Extensions["traceId"] = 
                    Activity.Current?.Id ?? context.HttpContext.TraceIdentifier;

                // Add timestamp
                context.ProblemDetails.Extensions["timestamp"] = DateTime.UtcNow;

                // Add path
                context.ProblemDetails.Instance ??= context.HttpContext.Request.Path;

                // Customize based on exception type
                if (context.Exception != null)
                {
                    switch (context.Exception)
                    {
                        case UnauthorizedAccessException:
                            context.ProblemDetails.Status = StatusCodes.Status401Unauthorized;
                            context.ProblemDetails.Title = "Unauthorized";
                            context.ProblemDetails.Type = "https://tools.ietf.org/html/rfc7235#section-3.1";
                            break;

                        case ArgumentNullException or ArgumentException:
                            context.ProblemDetails.Status = StatusCodes.Status400BadRequest;
                            context.ProblemDetails.Title = "Bad Request";
                            context.ProblemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.1";
                            break;

                        case KeyNotFoundException or FileNotFoundException:
                            context.ProblemDetails.Status = StatusCodes.Status404NotFound;
                            context.ProblemDetails.Title = "Not Found";
                            context.ProblemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.4";
                            break;

                        case InvalidOperationException when context.Exception.Message.Contains("conflict"):
                            context.ProblemDetails.Status = StatusCodes.Status409Conflict;
                            context.ProblemDetails.Title = "Conflict";
                            context.ProblemDetails.Type = "https://tools.ietf.org/html/rfc7231#section-6.5.8";
                            break;

                        default:
                            context.ProblemDetails.Status ??= StatusCodes.Status500InternalServerError;
                            context.ProblemDetails.Title ??= "Internal Server Error";
                            context.ProblemDetails.Type ??= "https://tools.ietf.org/html/rfc7231#section-6.6.1";
                            break;
                    }

                    if (includeExceptionDetails)
                    {
                        context.ProblemDetails.Extensions["exceptionType"] = context.Exception.GetType().Name;
                        context.ProblemDetails.Extensions["exceptionMessage"] = context.Exception.Message;
                        context.ProblemDetails.Extensions["stackTrace"] = context.Exception.StackTrace;
                    }
                }
            };
        });

        return services;
    }
}
