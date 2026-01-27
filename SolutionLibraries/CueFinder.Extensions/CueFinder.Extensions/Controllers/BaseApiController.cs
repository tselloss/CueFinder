using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CueFinder.Extensions.Controllers;

/// <summary>
/// Base controller class providing common functionality and helpers for all API controllers
/// Improves reusability and maintains consistent patterns across the application
/// </summary>
public abstract class BaseApiController : ControllerBase
{
    /// <summary>
    /// Extract the current user ID from JWT claims
    /// </summary>
    /// <returns>The user ID from the NameIdentifier claim</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown if user ID claim is not found</exception>
    protected int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token");

        return userId;
    }

    /// <summary>
    /// Check if the current user has admin role
    /// </summary>
    /// <returns>True if user is admin, false otherwise</returns>
    protected bool IsAdmin()
    {
        return User.IsInRole("admin") || User.HasClaim(ClaimTypes.Role, "admin");
    }

    /// <summary>
    /// Check if the current user has a specific role
    /// </summary>
    /// <param name="role">The role to check for</param>
    /// <returns>True if user has the role, false otherwise</returns>
    protected bool HasRole(string role)
    {
        return User.IsInRole(role) || User.HasClaim(ClaimTypes.Role, role);
    }

    /// <summary>
    /// Get the current user's ID safely without throwing
    /// </summary>
    /// <returns>The user ID, or -1 if not found</returns>
    protected int GetCurrentUserIdOrDefault()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdClaim, out var userId) ? userId : -1;
    }
}
