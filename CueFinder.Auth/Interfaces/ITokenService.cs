namespace CueFinder.Auth.Interfaces
{
    /// <summary>
    /// JWT token service interface
    /// </summary>
    public interface ITokenService
    {
        /// <summary>
        /// Generate JWT token for authenticated user
        /// </summary>
        /// <param name="userId">User ID</param>
        /// <param name="username">Username</param>
        /// <param name="role">User role</param>
        /// <returns>JWT token string</returns>
        string GenerateToken(int userId, string username, string role);

        /// <summary>
        /// Get token expiration time in seconds
        /// </summary>
        /// <returns>Expiration time in seconds</returns>
        int GetTokenExpirationSeconds();
    }
}
