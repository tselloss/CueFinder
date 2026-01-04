namespace CueFinder.Database.Models
{
    /// <summary>
    /// Represents a phone verification token for SMS/Viber validation
    /// Used for magic link authentication
    /// </summary>
    public class PhoneVerificationToken
    {
        /// <summary>
        /// Unique identifier for the verification token
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User ID associated with this verification
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Phone number to verify
        /// </summary>
        public string PhoneNumber { get; set; } = string.Empty;

        /// <summary>
        /// Unique verification token/code
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// Magic link URL token (for URL-based verification)
        /// </summary>
        public string MagicLinkToken { get; set; } = string.Empty;

        /// <summary>
        /// 4-digit verification code sent via SMS
        /// </summary>
        public string VerificationCode { get; set; } = string.Empty;

        /// <summary>
        /// Verification method used
        /// </summary>
        public string VerificationMethod { get; set; } = "SMS"; // SMS, Viber, WhatsApp

        /// <summary>
        /// Whether this token has been used
        /// </summary>
        public bool IsUsed { get; set; } = false;

        /// <summary>
        /// Whether the verification was successful
        /// </summary>
        public bool IsVerified { get; set; } = false;

        /// <summary>
        /// Token creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Token expiration timestamp (default: 15 minutes)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Timestamp when token was used/verified
        /// </summary>
        public DateTime? VerifiedAt { get; set; }

        /// <summary>
        /// IP address from which verification was initiated
        /// </summary>
        public string? IpAddress { get; set; }

        /// <summary>
        /// Number of verification attempts
        /// </summary>
        public int AttemptCount { get; set; } = 0;

        /// <summary>
        /// Maximum allowed attempts
        /// </summary>
        public int MaxAttempts { get; set; } = 3;

        /// <summary>
        /// Navigation property to User
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// Check if token is expired
        /// </summary>
        public bool IsExpired() => DateTime.UtcNow > ExpiresAt;

        /// <summary>
        /// Check if token is valid (not used, not expired, attempts remaining)
        /// </summary>
        public bool IsValid() => !IsUsed && !IsExpired() && AttemptCount < MaxAttempts;
    }
}
