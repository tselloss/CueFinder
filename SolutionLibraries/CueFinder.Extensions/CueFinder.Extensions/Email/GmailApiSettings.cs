namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Settings for Gmail API email service configuration
    /// </summary>
    public class GmailApiSettings
    {
        /// <summary>
        /// Service account credentials JSON content (alternative to credentials file path)
        /// </summary>
        public string ServiceAccountCredentialsJson { get; set; } = string.Empty;

        /// <summary>
        /// Path to the service account credentials JSON file
        /// </summary>
        public string ServiceAccountCredentialsPath { get; set; } = string.Empty;

        /// <summary>
        /// Email address to send from (must be authorized in Google Workspace)
        /// </summary>
        public string FromEmail { get; set; } = string.Empty;

        /// <summary>
        /// Display name for the sender
        /// </summary>
        public string FromName { get; set; } = "CueFinder Admin";

        /// <summary>
        /// User to impersonate when using domain-wide delegation (optional)
        /// Required if using service account with domain-wide delegation
        /// </summary>
        public string ImpersonateUser { get; set; } = string.Empty;

        /// <summary>
        /// Application name for Gmail API requests
        /// </summary>
        public string ApplicationName { get; set; } = "CueFinder";
    }
}
