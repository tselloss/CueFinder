namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Response model containing authentication token and user information
    /// </summary>
    public class AuthResponse
    {
        /// <summary>
        /// JWT access token for authenticated requests
        /// </summary>
        public string AccessToken { get; set; } = string.Empty;

        /// <summary>
        /// User ID
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Username
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User's display name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// User's email
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's phone
        /// </summary>
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// User's role (admin, user, etc.)
        /// </summary>
        public string Role { get; set; } = "user";

        /// <summary>
        /// Token expiration time in seconds
        /// </summary>
        public int ExpiresIn { get; set; }
    }
}
