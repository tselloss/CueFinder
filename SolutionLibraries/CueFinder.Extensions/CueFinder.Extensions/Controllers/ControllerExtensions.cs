using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using CueFinder.Extensions.ProblemDetails;
using CueFinder.Extensions.Responses;
using System.Security.Claims;

namespace CueFinder.Extensions.Controllers;

/// <summary>
/// Extension methods for Controller operations
/// </summary>
public static class ControllerExtensions
{
    /// <summary>
    /// Gets the user ID from the claims principal
    /// </summary>
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (int.TryParse(userIdClaim, out var userId))
        {
            return userId;
        }
        return null;
    }

    /// <summary>
    /// Gets the user ID from claims or throws UnauthorizedAccessException
    /// </summary>
    public static int GetUserIdOrThrow(this ClaimsPrincipal user)
    {
        var userId = user.GetUserId();
        if (!userId.HasValue)
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }
        return userId.Value;
    }

    /// <summary>
    /// Gets the user email from the claims principal
    /// </summary>
    public static string? GetUserEmail(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Email)?.Value;
    }

    /// <summary>
    /// Gets the user name from the claims principal
    /// </summary>
    public static string? GetUserName(this ClaimsPrincipal user)
    {
        return user.FindFirst(ClaimTypes.Name)?.Value;
    }

    /// <summary>
    /// Checks if the user has a specific role
    /// </summary>
    public static bool HasRole(this ClaimsPrincipal user, string role)
    {
        return user.IsInRole(role);
    }

    /// <summary>
    /// Creates a success response with data
    /// </summary>
    public static OkObjectResult Ok<T>(this ControllerBase controller, T data, string? message = null)
    {
        return controller.Ok(ApiResponse<T>.SuccessResponse(data, message));
    }

    /// <summary>
    /// Creates a created response with data
    /// </summary>
    public static CreatedAtActionResult Created<T>(
        this ControllerBase controller,
        string actionName,
        object? routeValues,
        T data,
        string? message = null)
    {
        return controller.CreatedAtAction(
            actionName,
            routeValues,
            ApiResponse<T>.SuccessResponse(data, message));
    }

    /// <summary>
    /// Creates a paginated response
    /// </summary>
    public static OkObjectResult OkPaginated<T>(
        this ControllerBase controller,
        IEnumerable<T> data,
        int page,
        int pageSize,
        int totalCount,
        string? message = null)
    {
        return controller.Ok(PaginatedApiResponse<T>.Create(data, page, pageSize, totalCount, message));
    }

    /// <summary>
    /// Creates a BadRequest response with ProblemDetails
    /// </summary>
    public static ObjectResult BadRequestProblem(
        this ControllerBase controller,
        string title,
        string detail,
        Dictionary<string, string[]>? errors = null)
    {
        if (errors != null && errors.Any())
        {
            return controller.BadRequest(
                ProblemDetailsExtensions.CreateValidationProblem(title, detail, errors));
        }
        
        return controller.BadRequest(
            ProblemDetailsExtensions.CreateBadRequestProblem(title, detail));
    }

    /// <summary>
    /// Creates a NotFound response with ProblemDetails
    /// </summary>
    public static NotFoundObjectResult NotFoundProblem(
        this ControllerBase controller,
        string title,
        string detail)
    {
        return controller.NotFound(
            ProblemDetailsExtensions.CreateNotFoundProblem(title, detail));
    }

    /// <summary>
    /// Creates an Unauthorized response with ProblemDetails
    /// </summary>
    public static UnauthorizedObjectResult UnauthorizedProblem(
        this ControllerBase controller,
        string? title = null,
        string? detail = null)
    {
        return controller.Unauthorized(
            ProblemDetailsExtensions.CreateUnauthorizedProblem(title ?? "Unauthorized", detail));
    }

    /// <summary>
    /// Creates a Forbidden response with ProblemDetails
    /// </summary>
    public static ObjectResult ForbiddenProblem(
        this ControllerBase controller,
        string? title = null,
        string? detail = null)
    {
        var problemDetails = ProblemDetailsExtensions.CreateForbiddenProblem(title ?? "Forbidden", detail);
        return new ObjectResult(problemDetails)
        {
            StatusCode = StatusCodes.Status403Forbidden
        };
    }

    /// <summary>
    /// Creates a Conflict response with ProblemDetails
    /// </summary>
    public static ConflictObjectResult ConflictProblem(
        this ControllerBase controller,
        string title,
        string detail)
    {
        return controller.Conflict(
            ProblemDetailsExtensions.CreateConflictProblem(title, detail));
    }

    /// <summary>
    /// Creates an Internal Server Error response with ProblemDetails
    /// </summary>
    public static ObjectResult InternalServerErrorProblem(
        this ControllerBase controller,
        string? detail = null,
        bool includeExceptionDetails = false,
        Exception? exception = null)
    {
        var problemDetails = ProblemDetailsExtensions.CreateInternalServerErrorProblem(
            detail, 
            null, 
            includeExceptionDetails, 
            exception);
        
        return new ObjectResult(problemDetails)
        {
            StatusCode = StatusCodes.Status500InternalServerError
        };
    }

    /// <summary>
    /// Validates model state and returns BadRequest with ProblemDetails if invalid
    /// </summary>
    public static ObjectResult? ValidateModelState(this ControllerBase controller)
    {
        if (!controller.ModelState.IsValid)
        {
            var errors = controller.ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                );

            return controller.BadRequestProblem(
                "Validation Failed",
                "One or more validation errors occurred",
                errors);
        }

        return null;
    }
}
