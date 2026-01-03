namespace CueFinder.Auth.Models
{
    /// <summary>
    /// User profile information
    /// </summary>
    public class UserProfile
    {
        /// <summary>
        /// User ID
        /// </summary>
        public int Id { get; set; }

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
        /// User's phone number
        /// </summary>
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// User's role (admin, user, etc.)
        /// </summary>
        public string Role { get; set; } = "user";

        /// <summary>
        /// Account creation date
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last profile update date
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
