using CueFinder.Auth.Interfaces;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;

namespace CueFinder.Auth.Services
{
    /// <summary>
    /// Service for handling phone verification with SMS/Viber magic links and codes
    /// </summary>
    public class PhoneVerificationService : IPhoneVerificationService
    {
        private readonly CueFinderDbContext _context;
        private readonly ISmsService _smsService;
        private readonly ILogger<PhoneVerificationService> _logger;
        private const int CODE_LENGTH = 4;
        private const int TOKEN_LENGTH = 64;
        private const int MAX_ATTEMPTS = 3;
        private const int TOKEN_EXPIRY_MINUTES = 15;
        private const int RESEND_COOLDOWN_SECONDS = 60;

        public PhoneVerificationService(
            CueFinderDbContext context,
            ISmsService smsService,
            ILogger<PhoneVerificationService> logger)
        {
            _context = context;
            _smsService = smsService;
            _logger = logger;
        }

        /// <summary>
        /// Initiate phone verification by sending code and magic link
        /// </summary>
        public async Task<PhoneVerificationToken> InitiateVerificationAsync(
            int userId, 
            string phoneNumber, 
            string method = "Viber",
            string? ipAddress = null)
        {
            try
            {
                // Check if user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    throw new ArgumentException("User not found");
                }

                // Invalidate any existing active tokens for this user and phone
                var existingTokens = await _context.PhoneVerificationTokens
                    .Where(t => t.UserId == userId && 
                                t.PhoneNumber == phoneNumber && 
                                !t.IsUsed && 
                                t.ExpiresAt > DateTime.UtcNow)
                    .ToListAsync();

                foreach (var token in existingTokens)
                {
                    token.IsUsed = true;
                }

                // Generate new verification token
                var verificationToken = new PhoneVerificationToken
                {
                    UserId = userId,
                    PhoneNumber = phoneNumber,
                    Token = GenerateSecureToken(TOKEN_LENGTH),
                    MagicLinkToken = GenerateSecureToken(TOKEN_LENGTH),
                    VerificationCode = GenerateVerificationCode(CODE_LENGTH),
                    VerificationMethod = method,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddMinutes(TOKEN_EXPIRY_MINUTES),
                    IpAddress = ipAddress,
                    AttemptCount = 0,
                    MaxAttempts = MAX_ATTEMPTS,
                    IsUsed = false,
                    IsVerified = false
                };

                _context.PhoneVerificationTokens.Add(verificationToken);
                await _context.SaveChangesAsync();

                // Send verification via SMS/Viber
                var baseUrl = Environment.GetEnvironmentVariable("BASE_URL") ?? "http://localhost:5000";
                var magicLink = $"{baseUrl}/api/auth/phone/verify-link/{verificationToken.MagicLinkToken}";

                bool sent = await _smsService.SendVerificationWithLinkAsync(
                    phoneNumber,
                    verificationToken.VerificationCode,
                    magicLink,
                    method);

                if (!sent)
                {
                    _logger.LogWarning("Failed to send verification to {PhoneNumber} via {Method}", 
                        phoneNumber, method);
                }

                _logger.LogInformation("Phone verification initiated for user {UserId}, phone {PhoneNumber}", 
                    userId, phoneNumber);

                return verificationToken;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating phone verification for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Verify phone using 4-digit code
        /// </summary>
        public async Task<bool> VerifyCodeAsync(string token, string code)
        {
            try
            {
                var verificationToken = await _context.PhoneVerificationTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed);

                if (verificationToken == null)
                {
                    _logger.LogWarning("Verification token not found or already used: {Token}", token);
                    return false;
                }

                // Check if token is expired
                if (verificationToken.IsExpired())
                {
                    _logger.LogWarning("Verification token expired: {Token}", token);
                    return false;
                }

                // Increment attempt count
                verificationToken.AttemptCount++;
                await _context.SaveChangesAsync();

                // Check if max attempts exceeded
                if (verificationToken.AttemptCount > verificationToken.MaxAttempts)
                {
                    verificationToken.IsUsed = true;
                    await _context.SaveChangesAsync();
                    _logger.LogWarning("Max verification attempts exceeded for token: {Token}", token);
                    return false;
                }

                // Verify code
                if (verificationToken.VerificationCode != code)
                {
                    _logger.LogWarning("Invalid verification code for token: {Token}", token);
                    return false;
                }

                // Mark as verified
                verificationToken.IsVerified = true;
                verificationToken.IsUsed = true;
                verificationToken.VerifiedAt = DateTime.UtcNow;

                // Update user phone verification status
                if (verificationToken.User != null)
                {
                    verificationToken.User.IsPhoneVerified = true;
                    verificationToken.User.PhoneVerifiedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Phone verified successfully for user {UserId}", 
                    verificationToken.UserId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying code for token {Token}", token);
                throw;
            }
        }

        /// <summary>
        /// Verify phone using magic link token
        /// </summary>
        public async Task<bool> VerifyMagicLinkAsync(string magicLinkToken)
        {
            try
            {
                var verificationToken = await _context.PhoneVerificationTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.MagicLinkToken == magicLinkToken && !t.IsUsed);

                if (verificationToken == null)
                {
                    _logger.LogWarning("Magic link token not found or already used: {Token}", magicLinkToken);
                    return false;
                }

                // Check if token is expired
                if (verificationToken.IsExpired())
                {
                    _logger.LogWarning("Magic link token expired: {Token}", magicLinkToken);
                    return false;
                }

                // Mark as verified
                verificationToken.IsVerified = true;
                verificationToken.IsUsed = true;
                verificationToken.VerifiedAt = DateTime.UtcNow;

                // Update user phone verification status
                if (verificationToken.User != null)
                {
                    verificationToken.User.IsPhoneVerified = true;
                    verificationToken.User.PhoneVerifiedAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Phone verified via magic link for user {UserId}", 
                    verificationToken.UserId);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying magic link token {Token}", magicLinkToken);
                throw;
            }
        }

        /// <summary>
        /// Get verification token by token string
        /// </summary>
        public async Task<PhoneVerificationToken?> GetVerificationTokenAsync(string token)
        {
            try
            {
                return await _context.PhoneVerificationTokens
                    .Include(t => t.User)
                    .FirstOrDefaultAsync(t => t.Token == token);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verification token {Token}", token);
                throw;
            }
        }

        /// <summary>
        /// Resend verification code with rate limiting
        /// </summary>
        public async Task<bool> ResendVerificationAsync(string token)
        {
            try
            {
                var verificationToken = await _context.PhoneVerificationTokens
                    .FirstOrDefaultAsync(t => t.Token == token && !t.IsUsed);

                if (verificationToken == null)
                {
                    _logger.LogWarning("Verification token not found for resend: {Token}", token);
                    return false;
                }

                // Check if token is expired
                if (verificationToken.IsExpired())
                {
                    _logger.LogWarning("Cannot resend - token expired: {Token}", token);
                    return false;
                }

                // Check resend cooldown
                if (verificationToken.LastResentAt.HasValue)
                {
                    var timeSinceLastResend = DateTime.UtcNow - verificationToken.LastResentAt.Value;
                    if (timeSinceLastResend.TotalSeconds < RESEND_COOLDOWN_SECONDS)
                    {
                        _logger.LogWarning("Resend cooldown active for token: {Token}", token);
                        return false;
                    }
                }

                // Resend verification
                var baseUrl = Environment.GetEnvironmentVariable("BASE_URL") ?? "http://localhost:5000";
                var magicLink = $"{baseUrl}/api/auth/phone/verify-link/{verificationToken.MagicLinkToken}";

                bool sent = await _smsService.SendVerificationWithLinkAsync(
                    verificationToken.PhoneNumber,
                    verificationToken.VerificationCode,
                    magicLink,
                    verificationToken.VerificationMethod);

                if (sent)
                {
                    verificationToken.LastResentAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation("Verification resent for token: {Token}", token);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resending verification for token {Token}", token);
                throw;
            }
        }

        /// <summary>
        /// Check if phone number is already verified for a user
        /// </summary>
        public async Task<bool> IsPhoneVerifiedAsync(int userId, string phoneNumber)
        {
            try
            {
                var user = await _context.Users.FindAsync(userId);
                if (user == null) return false;

                return user.IsPhoneVerified && user.Phone == phoneNumber;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking phone verification status for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Generate cryptographically secure random token
        /// </summary>
        private string GenerateSecureToken(int length)
        {
            var bytes = new byte[length];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(bytes);
            }
            return Convert.ToBase64String(bytes)
                .Replace("+", "")
                .Replace("/", "")
                .Replace("=", "")
                .Substring(0, length);
        }

        /// <summary>
        /// Generate random numeric verification code
        /// </summary>
        private string GenerateVerificationCode(int length)
        {
            var random = new Random();
            var code = "";
            for (int i = 0; i < length; i++)
            {
                code += random.Next(0, 10).ToString();
            }
            return code;
        }
    }
}
