namespace CueFinder.Database.Models
{
    /// <summary>
    /// Password reset token entity for secure password recovery
    /// Implements one-time-use, time-limited tokens bound to specific users
    /// </summary>
    public class PasswordResetToken
    {
        /// <summary>
        /// Unique identifier for this reset token
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Foreign key to the User entity
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Navigation property to User
        /// </summary>
        public User? User { get; set; }

        /// <summary>
        /// SHA-256 hash of the actual token (never store the plain token)
        /// Token hash = SHA256(token + serverPepper)
        /// </summary>
        public string TokenHash { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when this token was created
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Timestamp when this token expires (typically 30 minutes from creation)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// Flag to ensure token can only be used once
        /// </summary>
        public bool IsUsed { get; set; }

        /// <summary>
        /// Timestamp when token was used (if IsUsed is true)
        /// </summary>
        public DateTime? UsedAt { get; set; }

        /// <summary>
        /// IP address that requested the reset (for audit logging)
        /// </summary>
        public string? RequestIpAddress { get; set; }

        /// <summary>
        /// User agent from the reset request (for audit logging)
        /// </summary>
        public string? RequestUserAgent { get; set; }

        /// <summary>
        /// Purpose of the token (e.g., "password_reset", "email_verification")
        /// Ensures tokens can't be reused for different purposes
        /// </summary>
        public string Purpose { get; set; } = "password_reset";
    }
}
