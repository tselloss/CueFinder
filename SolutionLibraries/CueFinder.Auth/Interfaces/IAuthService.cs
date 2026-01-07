using CueFinder.Auth.Models;

namespace CueFinder.Auth.Interfaces
{
    /// <summary>
    /// Authentication service interface
    /// </summary>
    public interface IAuthService
    {
        /// <summary>
        /// Authenticate user with username and password
        /// </summary>
        /// <param name="username">Username or email</param>
        /// <param name="password">User password</param>
        /// <returns>Authentication response with JWT token</returns>
        Task<AuthResponse> LoginAsync(string username, string password);

        /// <summary>
        /// Register a new user account
        /// </summary>
        /// <param name="request">Registration request with user details</param>
        /// <returns>Authentication response with JWT token</returns>
        Task<AuthResponse> RegisterAsync(RegisterRequest request);

        /// <summary>
        /// Get current user profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>User profile information</returns>
        Task<UserProfile?> GetUserProfileAsync(int userId);

        /// <summary>
        /// Update user profile
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="name">Updated display name</param>
        /// <param name="email">Updated email</param>
        /// <param name="phone">Updated phone number</param>
        /// <param name="location">Updated location</param>
        /// <param name="address">Updated street address</param>
        /// <param name="city">Updated city</param>
        /// <param name="state">Updated state/province</param>
        /// <param name="zipCode">Updated ZIP/postal code</param>
        /// <param name="country">Updated country</param>
        /// <returns>Updated user profile</returns>
        Task<UserProfile?> UpdateUserProfileAsync(int userId, string name, string email, string phone, string location, string address, string city, string state, string zipCode, string country);

        /// <summary>
        /// Verify if a user exists
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <returns>True if user exists</returns>
        Task<bool> UserExistsAsync(int userId);

        /// <summary>
        /// Authenticate user via external OAuth provider (Google, Apple)
        /// </summary>
        /// <param name="request">External authentication request with provider and token</param>
        /// <returns>Authentication response with JWT token</returns>
        Task<AuthResponse> ExternalLoginAsync(ExternalAuthRequest request);
    }
}
