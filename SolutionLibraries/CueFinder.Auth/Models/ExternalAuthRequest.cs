namespace CueFinder.Auth.Models
{
    /// <summary>
    /// External authentication provider types
    /// </summary>
    public enum ExternalAuthProvider
    {
        Google,
        Apple
    }

    /// <summary>
    /// Request model for external OAuth authentication
    /// </summary>
    public class ExternalAuthRequest
    {
        /// <summary>
        /// OAuth provider (Google or Apple)
        /// </summary>
        public ExternalAuthProvider Provider { get; set; }

        /// <summary>
        /// ID token from the OAuth provider
        /// </summary>
        public string IdToken { get; set; } = string.Empty;

        /// <summary>
        /// Optional: User's email from OAuth provider
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Optional: User's name from OAuth provider
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// Optional: User's profile picture URL
        /// </summary>
        public string? PictureUrl { get; set; }
    }
}
