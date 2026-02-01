namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Request model for password reset initiation (forgot password)
    /// </summary>
    public class ForgotPasswordRequest
    {
        /// <summary>
        /// User's email address or username
        /// </summary>
        public string EmailOrUsername { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model to validate a reset token before allowing password change
    /// </summary>
    public class ValidateResetTokenRequest
    {
        /// <summary>
        /// The reset token from the email link
        /// </summary>
        public string Token { get; set; } = string.Empty;
    }

    /// <summary>
    /// Request model to reset the password using a valid token
    /// </summary>
    public class ResetPasswordRequest
    {
        /// <summary>
        /// The reset token from the email link
        /// </summary>
        public string Token { get; set; } = string.Empty;

        /// <summary>
        /// New password (should meet policy requirements)
        /// </summary>
        public string NewPassword { get; set; } = string.Empty;

        /// <summary>
        /// Confirmation of new password (must match NewPassword)
        /// </summary>
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
