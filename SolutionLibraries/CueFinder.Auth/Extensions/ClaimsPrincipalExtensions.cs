using System;
using System.Security.Claims;

namespace CueFinder.Auth.Extensions
{
    /// <summary>
    /// Extension methods for ClaimsPrincipal to extract user information from JWT claims.
    /// </summary>
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Gets the user ID from the claims. Returns null if not found or invalid.
        /// </summary>
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var userIdClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                              user?.FindFirst("sub")?.Value ??
                              user?.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return null;
            }

            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }

            return null;
        }

        /// <summary>
        /// Gets the user ID from the claims. Throws an exception if not found or invalid.
        /// </summary>
        public static int GetUserIdOrThrow(this ClaimsPrincipal user)
        {
            var userId = user.GetUserId();
            if (!userId.HasValue)
            {
                throw new UnauthorizedAccessException("User ID not found in claims");
            }

            return userId.Value;
        }

        /// <summary>
        /// Gets the username from the claims.
        /// </summary>
        public static string GetUsername(this ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Name)?.Value ?? 
                   user?.FindFirst("username")?.Value ?? 
                   "Unknown";
        }

        /// <summary>
        /// Gets the email from the claims.
        /// </summary>
        public static string GetEmail(this ClaimsPrincipal user)
        {
            return user?.FindFirst(ClaimTypes.Email)?.Value ?? 
                   user?.FindFirst("email")?.Value ?? 
                   string.Empty;
        }

        /// <summary>
        /// Gets a specific claim value by type.
        /// </summary>
        public static string GetClaimValue(this ClaimsPrincipal user, string claimType)
        {
            return user?.FindFirst(claimType)?.Value ?? string.Empty;
        }
    }
}
