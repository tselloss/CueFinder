using CueFinder.Database.Models;

namespace CueFinder.Auth.Interfaces
{
    /// <summary>
    /// Interface for phone verification service
    /// </summary>
    public interface IPhoneVerificationService
    {
        /// <summary>
        /// Initiate phone verification by sending code and magic link
        /// </summary>
        Task<PhoneVerificationToken> InitiateVerificationAsync(int userId, string phoneNumber, string method = "Viber", string? ipAddress = null);

        /// <summary>
        /// Verify phone using code
        /// </summary>
        Task<bool> VerifyCodeAsync(string token, string code);

        /// <summary>
        /// Verify phone using magic link token
        /// </summary>
        Task<bool> VerifyMagicLinkAsync(string magicLinkToken);

        /// <summary>
        /// Get verification token by token string
        /// </summary>
        Task<PhoneVerificationToken?> GetVerificationTokenAsync(string token);

        /// <summary>
        /// Resend verification code
        /// </summary>
        Task<bool> ResendVerificationAsync(string token);

        /// <summary>
        /// Check if phone number is already verified for a user
        /// </summary>
        Task<bool> IsPhoneVerifiedAsync(int userId, string phoneNumber);
    }
}
