namespace CueFinder.Extensions.Email
{
    /// <summary>
    /// Settings for Gmail API configuration
    /// </summary>
    public class GmailApiSettings
    {
        /// <summary>
        /// Google OAuth2 client ID
        /// </summary>
        public string ClientId { get; set; } = string.Empty;

        /// <summary>
        /// Google OAuth2 client secret
        /// </summary>
        public string ClientSecret { get; set; } = string.Empty;

        /// <summary>
        /// Google project ID
        /// </summary>
        public string ProjectId { get; set; } = string.Empty;

        /// <summary>
        /// Email address to send from (Gmail account)
        /// </summary>
        public string FromEmail { get; set; } = string.Empty;

        /// <summary>
        /// Display name for the sender
        /// </summary>
        public string FromName { get; set; } = "CueFinder";

        /// <summary>
        /// Path to stored OAuth token (for refresh tokens)
        /// </summary>
        public string TokenPath { get; set; } = "gmail_token.json";

        /// <summary>
        /// Whether this provider is enabled
        /// </summary>
        public bool Enabled { get; set; } = false;
    }
}
