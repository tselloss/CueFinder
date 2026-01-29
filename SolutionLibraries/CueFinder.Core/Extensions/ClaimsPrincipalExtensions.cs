using System.Security.Claims;

namespace CueFinder.Core.Extensions;

/// <summary>
/// Extension methods for ClaimsPrincipal to extract user information from JWT claims.
/// </summary>
public static class ClaimsPrincipalExtensions
{
    private const string UserIdClaimType = "sub";

    /// <summary>
    /// Gets the user ID from JWT claims.
    /// </summary>
    /// <returns>The user ID if found, null otherwise.</returns>
    public static int? GetUserId(this ClaimsPrincipal user)
    {
        if (user?.FindFirst(UserIdClaimType)?.Value is string userIdStr &&
            int.TryParse(userIdStr, out int userId))
        {
            return userId;
        }

        return null;
    }

    /// <summary>
    /// Gets the user ID from JWT claims, throwing if not found.
    /// </summary>
    /// <returns>The user ID.</returns>
    /// <exception cref="UnauthorizedAccessException">Thrown when user ID is not found in claims.</exception>
    public static int GetUserIdOrThrow(this ClaimsPrincipal user)
    {
        var userId = user.GetUserId();
        if (userId is null)
        {
            throw new UnauthorizedAccessException("User ID not found in claims");
        }

        return userId.Value;
    }

    /// <summary>
    /// Gets the username from JWT claims.
    /// </summary>
    public static string? GetUsername(this ClaimsPrincipal user)
    {
        return user?.FindFirst(ClaimTypes.Name)?.Value;
    }

    /// <summary>
    /// Gets the user's email from JWT claims.
    /// </summary>
    public static string? GetEmail(this ClaimsPrincipal user)
    {
        return user?.FindFirst(ClaimTypes.Email)?.Value;
    }

    /// <summary>
    /// Gets the user's roles from JWT claims.
    /// </summary>
    public static IEnumerable<string> GetRoles(this ClaimsPrincipal user)
    {
        return user?.FindAll(ClaimTypes.Role) ?? Array.Empty<Claim>()
            .Select(c => c.Value) ?? Array.Empty<string>();
    }
}
