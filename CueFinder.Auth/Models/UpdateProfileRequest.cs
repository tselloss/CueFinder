namespace CueFinder.Auth.Models
{
    /// <summary>
    /// Request model for updating user profile
    /// </summary>
    public class UpdateProfileRequest
    {
        /// <summary>
        /// Updated display name
        /// </summary>
        public string? Name { get; set; }

        /// <summary>
        /// Updated email address
        /// </summary>
        public string? Email { get; set; }

        /// <summary>
        /// Updated phone number
        /// </summary>
        public string? Phone { get; set; }
    }
}
