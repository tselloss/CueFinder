namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Request model for user login
    /// </summary>
    public class LoginRequest
    {
        /// <summary>
        /// Username or email for login
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// User password
        /// </summary>
        public string Password { get; set; } = string.Empty;
    }
}
