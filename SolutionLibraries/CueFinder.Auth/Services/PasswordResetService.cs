using System.Security.Cryptography;
using System.Text;
using CueFinder.Auth.Interfaces;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CueFinder.Auth.Services
{
    /// <summary>
    /// Implementation of secure password reset service
    /// Generates one-time-use, time-limited, cryptographically secure tokens
    /// </summary>
    public class PasswordResetService : IPasswordResetService
    {
        private readonly CueFinderDbContext _dbContext;
        private readonly IUserService _userService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<PasswordResetService> _logger;

        // Configuration constants (moved to appsettings in production)
        private const int TOKEN_LENGTH_BYTES = 32;
        private const int TOKEN_EXPIRY_MINUTES = 30;
        private const string PURPOSE = "password_reset";

        public PasswordResetService(
            CueFinderDbContext dbContext,
            IUserService userService,
            IConfiguration configuration,
            ILogger<PasswordResetService> logger)
        {
            _dbContext = dbContext;
            _userService = userService;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Generate a cryptographically secure reset token
        /// Token is: [32-byte random]
        /// </summary>
        public async Task<string> GenerateResetTokenAsync(int userId, string ipAddress, string userAgent)
        {
            try
            {
                // Verify user exists
                var user = await _userService.GetUserAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("Password reset requested for non-existent user: {UserId}", userId);
                    throw new InvalidOperationException("User not found");
                }

                // Check rate limiting
                if (await IsResetRequestRateLimitExceededAsync(userId))
                {
                    _logger.LogWarning("Password reset rate limit exceeded for user: {UserId}", userId);
                    throw new InvalidOperationException("Too many reset requests. Please try again later.");
                }

                // Generate cryptographically secure random token
                using (var rng = RandomNumberGenerator.Create())
                {
                    byte[] tokenBytes = new byte[TOKEN_LENGTH_BYTES];
                    rng.GetBytes(tokenBytes);
                    string plainToken = Convert.ToBase64String(tokenBytes)
                        .Replace("+", "-")
                        .Replace("/", "_")
                        .Replace("=", "");

                    // Hash token for storage (never store plain token in DB)
                    string serverPepper = _configuration["PasswordReset:ServerPepper"] ?? "CueFinder-DefaultPepper";
                    string tokenHash = HashToken(plainToken, serverPepper);

                    // Create token record
                    var resetToken = new PasswordResetToken
                    {
                        UserId = userId,
                        TokenHash = tokenHash,
                        CreatedAt = DateTime.UtcNow,
                        ExpiresAt = DateTime.UtcNow.AddMinutes(TOKEN_EXPIRY_MINUTES),
                        IsUsed = false,
                        RequestIpAddress = ipAddress,
                        RequestUserAgent = userAgent,
                        Purpose = PURPOSE
                    };

                    _dbContext.PasswordResetTokens.Add(resetToken);
                    await _dbContext.SaveChangesAsync();

                    _logger.LogInformation(
                        "Password reset token generated for user {UserId} from IP {IpAddress}",
                        userId,
                        ipAddress);

                    return plainToken;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating password reset token for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Validate a password reset token
        /// Checks: exists, not expired, not already used, purpose is correct
        /// </summary>
        public async Task<int?> ValidateResetTokenAsync(string token)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(token))
                {
                    return null;
                }

                // Hash the provided token
                string serverPepper = _configuration["PasswordReset:ServerPepper"] ?? "CueFinder-DefaultPepper";
                string tokenHash = HashToken(token, serverPepper);

                // Find matching token in database
                var resetToken = await _dbContext.PasswordResetTokens
                    .FirstOrDefaultAsync(t =>
                        t.TokenHash == tokenHash &&
                        t.Purpose == PURPOSE &&
                        !t.IsUsed &&
                        t.ExpiresAt > DateTime.UtcNow);

                if (resetToken == null)
                {
                    _logger.LogWarning("Invalid, expired, or already used reset token");
                    return null;
                }

                return resetToken.UserId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating password reset token");
                return null;
            }
        }

        /// <summary>
        /// Reset user password using a valid token
        /// </summary>
        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(token) || string.IsNullOrWhiteSpace(newPassword))
                {
                    return false;
                }

                // Validate token and get user ID
                int? userId = await ValidateResetTokenAsync(token);
                if (!userId.HasValue)
                {
                    _logger.LogWarning("Attempted password reset with invalid token");
                    return false;
                }

                // Get user
                var user = await _userService.GetUserAsync(userId.Value);
                if (user == null)
                {
                    _logger.LogWarning("Attempted password reset for non-existent user: {UserId}", userId);
                    return false;
                }

                // Hash the provided token to mark as used
                string serverPepper = _configuration["PasswordReset:ServerPepper"] ?? "CueFinder-DefaultPepper";
                string tokenHash = HashToken(token, serverPepper);

                // Get the token record
                var resetToken = await _dbContext.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

                if (resetToken == null)
                {
                    return false;
                }

                // Mark token as used
                resetToken.IsUsed = true;
                resetToken.UsedAt = DateTime.UtcNow;

                // Update user password
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
                user.PasswordHash = passwordHash;
                user.UpdatedAt = DateTime.UtcNow;

                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Password reset successful for user {UserId}", userId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting password");
                return false;
            }
        }

        /// <summary>
        /// Clean up expired tokens periodically
        /// </summary>
        public async Task<int> CleanupExpiredTokensAsync()
        {
            try
            {
                var expiredTokens = await _dbContext.PasswordResetTokens
                    .Where(t => t.ExpiresAt < DateTime.UtcNow || (t.IsUsed && t.UsedAt.HasValue && t.UsedAt.Value.AddDays(7) < DateTime.UtcNow))
                    .ToListAsync();

                int deletedCount = expiredTokens.Count;

                if (deletedCount > 0)
                {
                    _dbContext.PasswordResetTokens.RemoveRange(expiredTokens);
                    await _dbContext.SaveChangesAsync();
                    _logger.LogInformation("Cleaned up {Count} expired password reset tokens", deletedCount);
                }

                return deletedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error cleaning up expired password reset tokens");
                return 0;
            }
        }

        /// <summary>
        /// Check if user has exceeded rate limit for reset requests
        /// </summary>
        public async Task<bool> IsResetRequestRateLimitExceededAsync(int userId, int minutesWindow = 60, int maxAttempts = 5)
        {
            try
            {
                var windowStart = DateTime.UtcNow.AddMinutes(-minutesWindow);

                var recentRequests = await _dbContext.PasswordResetTokens
                    .Where(t =>
                        t.UserId == userId &&
                        t.Purpose == PURPOSE &&
                        t.CreatedAt >= windowStart)
                    .CountAsync();

                return recentRequests >= maxAttempts;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking reset rate limit for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Get audit information about a token
        /// </summary>
        public async Task<(DateTime CreatedAt, string? IpAddress, string? UserAgent)> GetTokenAuditInfoAsync(string token)
        {
            try
            {
                string serverPepper = _configuration["PasswordReset:ServerPepper"] ?? "CueFinder-DefaultPepper";
                string tokenHash = HashToken(token, serverPepper);

                var resetToken = await _dbContext.PasswordResetTokens
                    .FirstOrDefaultAsync(t => t.TokenHash == tokenHash);

                if (resetToken == null)
                {
                    return (DateTime.MinValue, null, null);
                }

                return (resetToken.CreatedAt, resetToken.RequestIpAddress, resetToken.RequestUserAgent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting token audit info");
                return (DateTime.MinValue, null, null);
            }
        }

        /// <summary>
        /// Hash a token using SHA-256 with server pepper
        /// </summary>
        private string HashToken(string token, string serverPepper)
        {
            string combined = token + serverPepper;
            using (var sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(combined));
                return Convert.ToHexString(hashBytes).ToLower();
            }
        }
    }
}
