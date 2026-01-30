using System.Text.Json.Serialization;

namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Request model for user login
    /// </summary>
    public class LoginRequest
    {
        /// <summary>
        /// Username or email for login (accepts both "username" and "emailOrUsername")
        /// </summary>
        [JsonPropertyName("username")]
        public string? Username { get; set; }

        /// <summary>
        /// Alternative property name for username (e2e test compatibility)
        /// </summary>
        [JsonPropertyName("emailOrUsername")]
        public string? EmailOrUsername { get; set; }

        /// <summary>
        /// Gets the username value from either property
        /// </summary>
        [JsonIgnore]
        public string UsernameValue => Username ?? EmailOrUsername ?? string.Empty;

        /// <summary>
        /// User password
        /// </summary>
        [JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;
    }
}
