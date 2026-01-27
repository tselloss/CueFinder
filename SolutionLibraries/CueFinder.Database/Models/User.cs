using Microsoft.EntityFrameworkCore;

namespace CueFinder.Database.Models
{
    /// <summary>
    /// Core User entity for the CueFinder application
    /// </summary>
    [Index(nameof(Username), IsUnique = true, Name = "IX_User_Username")]
    [Index(nameof(Email), IsUnique = true, Name = "IX_User_Email")]
    public class User
    {
        /// <summary>
        /// Unique user identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Username for authentication (unique)
        /// </summary>
        public string Username { get; set; } = string.Empty;

        /// <summary>
        /// Hashed password
        /// </summary>
        public string PasswordHash { get; set; } = string.Empty;

        /// <summary>
        /// User's display name
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// User's email address (unique)
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
        /// User's role (admin, seller, buyer, etc.)
        /// </summary>
        public string Role { get; set; } = "user";

        /// <summary>
        /// Profile picture URL
        /// </summary>
        public string? ProfilePictureUrl { get; set; }

        /// <summary>
        /// User's bio or description
        /// </summary>
        public string? Bio { get; set; }

        /// <summary>
        /// Address information
        /// </summary>
        public string? Address { get; set; }

        /// <summary>
        /// City
        /// </summary>
        public string? City { get; set; }

        /// <summary>
        /// State/Province
        /// </summary>
        public string? State { get; set; }

        /// <summary>
        /// ZIP/Postal code
        /// </summary>
        public string? ZipCode { get; set; }

        /// <summary>
        /// Country
        /// </summary>
        public string? Country { get; set; }

        /// <summary>
        /// General location (City/Area) - for display purposes
        /// </summary>
        public string? Location { get; set; }

    /// <summary>
    /// Whether the user's email is verified
    /// </summary>
    public bool IsEmailVerified { get; set; } = false;

    /// <summary>
    /// Whether the user's phone is verified
    /// </summary>
    public bool IsPhoneVerified { get; set; } = false;

    /// <summary>
    /// Phone verification timestamp
    /// </summary>
    public DateTime? PhoneVerifiedAt { get; set; }

    /// <summary>
    /// Whether the account is verified (email or phone)
    /// </summary>
    public bool IsVerified { get; set; } = false;

    /// <summary>
    /// External OAuth provider (Google, Apple, etc.)
    /// </summary>
    public string? ExternalProvider { get; set; }

    /// <summary>
    /// External provider's user ID
    /// </summary>
    public string? ExternalProviderId { get; set; }

    /// <summary>
    /// Whether the account is active
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Whether the user is banned
    /// </summary>
    public bool IsBanned { get; set; } = false;

    /// <summary>
    /// Reason for the ban
    /// </summary>
    public string? BanReason { get; set; }

    /// <summary>
    /// Timestamp when the user was banned
    /// </summary>
    public DateTime? BannedAt { get; set; }

    /// <summary>
    /// Whether the user accepted the terms and conditions
    /// </summary>
    public bool AcceptedTerms { get; set; } = false;

    /// <summary>
    /// Timestamp when the user accepted the terms
    /// </summary>
    public DateTime? AcceptedTermsAt { get; set; }

    /// <summary>
        /// Account creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last profile update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        /// <summary>
        /// Last login timestamp
        /// </summary>
        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        /// <summary>
        /// Cues posted by this user
        /// </summary>
        public virtual ICollection<Cue>? PostedCues { get; set; }

        /// <summary>
        /// Ratings given by this user
        /// </summary>
        public virtual ICollection<Rating>? RatingsGiven { get; set; }

        /// <summary>
        /// Ratings received by this user
        /// </summary>
        public virtual ICollection<Rating>? RatingsReceived { get; set; }

        /// <summary>
        /// Messages sent by this user
        /// </summary>
        public virtual ICollection<Message>? SentMessages { get; set; }

        /// <summary>
        /// Messages received by this user
        /// </summary>
        public virtual ICollection<Message>? ReceivedMessages { get; set; }

        /// <summary>
        /// Saved/Favorited cues by this user
        /// </summary>
        public virtual ICollection<SavedCue>? SavedCues { get; set; }

        /// <summary>
        /// Saved/Favorited billiard tables by this user
        /// </summary>
        public virtual ICollection<SavedBilliardTable>? SavedBilliardTables { get; set; }

        /// <summary>
        /// Phone verification tokens for this user
        /// </summary>
        public virtual ICollection<PhoneVerificationToken>? PhoneVerificationTokens { get; set; }
    }
}
