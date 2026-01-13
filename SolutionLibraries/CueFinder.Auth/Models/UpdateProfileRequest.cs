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

        /// <summary>
        /// Updated location (general area)
        /// </summary>
        public string? Location { get; set; }

        /// <summary>
        /// Updated street address
        /// </summary>
        public string? Address { get; set; }

        /// <summary>
        /// Updated city
        /// </summary>
        public string? City { get; set; }

        /// <summary>
        /// Updated state or province
        /// </summary>
        public string? State { get; set; }

        /// <summary>
        /// Updated ZIP or postal code
        /// </summary>
        public string? ZipCode { get; set; }

        /// <summary>
        /// Updated country
        /// </summary>
        public string? Country { get; set; }

        /// <summary>
        /// Preference to hide phone number from others
        /// </summary>
        public bool? HidePhone { get; set; }
    }
}
