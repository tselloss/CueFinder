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
        /// Whether to hide the phone number from other users
        /// </summary>
        public bool HidePhone { get; set; } = false;

        /// <summary>
        /// User's role (admin, user, etc.)
        /// </summary>
        public string Role { get; set; } = "user";

        /// <summary>
        /// Whether the user account is active
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// User's location (city/general area)
        /// </summary>
        public string? Location { get; set; }

        /// <summary>
        /// User's street address
        /// </summary>
        public string? Address { get; set; }

        /// <summary>
        /// User's city
        /// </summary>
        public string? City { get; set; }

        /// <summary>
        /// User's state or province
        /// </summary>
        public string? State { get; set; }

        /// <summary>
        /// User's ZIP or postal code
        /// </summary>
        public string? ZipCode { get; set; }

        /// <summary>
        /// User's country
        /// </summary>
        public string? Country { get; set; }

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
