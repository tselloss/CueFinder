namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Request model for user registration
    /// </summary>
    public class RegisterRequest
    {
        /// <summary>
        /// Username for the new account
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Password for the new account
        /// </summary>
        public string Password { get; set; } = string.Empty;

        /// <summary>
        /// User's full name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// User's email address
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// User's phone number
        /// </summary>
        public string Phone { get; set; } = string.Empty;
    }
}
