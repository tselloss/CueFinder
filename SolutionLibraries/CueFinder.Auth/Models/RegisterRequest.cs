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

    /// <summary>
    /// Street address
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// City
    /// </summary>
    public string? City { get; set; }

    /// <summary>
    /// State or Province
    /// </summary>
    public string? State { get; set; }

    /// <summary>
    /// ZIP or Postal code
    /// </summary>
    public string? ZipCode { get; set; }

    /// <summary>
    /// Country
    /// </summary>
    public string? Country { get; set; }

    /// <summary>
    /// Whether the user accepts the terms and conditions
    /// </summary>
    public bool AcceptedTerms { get; set; } = false;

    /// <summary>
    /// Whether the user is requesting club owner access
    /// </summary>
    public bool WantsClubOwner { get; set; } = false;
}
}