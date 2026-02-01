namespace CueFinder.Auth.Interfaces
{
    /// <summary>
    /// Interface for secure password reset functionality
    /// Handles generation, validation, and redemption of password reset tokens
    /// </summary>
    public interface IPasswordResetService
    {
        /// <summary>
        /// Generate a secure password reset token for a user
        /// </summary>
        /// <param name="userId">The user ID requesting password reset</param>
        /// <param name="ipAddress">The IP address from which the request originated</param>
        /// <param name="userAgent">The user agent of the requesting browser/client</param>
        /// <returns>The plain token to be sent via email (store hash in DB)</returns>
        Task<string> GenerateResetTokenAsync(int userId, string ipAddress, string userAgent);

        /// <summary>
        /// Validate a password reset token
        /// </summary>
        /// <param name="token">The plain token from the reset link</param>
        /// <returns>The user ID if valid, null if invalid/expired/already used</returns>
        Task<int?> ValidateResetTokenAsync(string token);

        /// <summary>
        /// Reset a user's password using a valid token
        /// Marks token as used and updates the user's password
        /// </summary>
        /// <param name="token">The reset token</param>
        /// <param name="newPassword">The new password (should be pre-validated for policy)</param>
        /// <returns>True if reset succeeded, false if token invalid</returns>
        Task<bool> ResetPasswordAsync(string token, string newPassword);

        /// <summary>
        /// Clean up expired tokens (scheduled task)
        /// </summary>
        /// <returns>Number of tokens deleted</returns>
        Task<int> CleanupExpiredTokensAsync();

        /// <summary>
        /// Check if a user has too many recent reset requests (rate limiting)
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <param name="minutesWindow">Time window to check (default 60 minutes)</param>
        /// <param name="maxAttempts">Maximum allowed attempts in window (default 5)</param>
        /// <returns>True if exceeded, false if within limits</returns>
        Task<bool> IsResetRequestRateLimitExceededAsync(int userId, int minutesWindow = 60, int maxAttempts = 5);

        /// <summary>
        /// Get audit info about a token
        /// </summary>
        /// <param name="token">The reset token</param>
        /// <returns>Token details for audit logging</returns>
        Task<(DateTime CreatedAt, string? IpAddress, string? UserAgent)> GetTokenAuditInfoAsync(string token);
    }
}
