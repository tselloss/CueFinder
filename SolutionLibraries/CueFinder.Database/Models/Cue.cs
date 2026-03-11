namespace CueFinder.Database.Models
{
    /// <summary>
    /// Billiard cue listing entity
    /// </summary>
    public class Cue
    {
        /// <summary>
        /// Unique cue identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Title/Name of the cue
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Brand of the cue (e.g., Predator, Schmelke, etc.)
        /// </summary>
        public string Brand { get; set; } = string.Empty;

        /// <summary>
        /// Detailed description of the cue
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Price in dollars
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Type of cue (break cue, jump cue, playing cue, etc.)
        /// </summary>
        public string CueType { get; set; } = "playing";

        /// <summary>
        /// Cue weight in ounces
        /// </summary>
        public decimal? Weight { get; set; }

        /// <summary>
        /// Cue length in inches
        /// </summary>
        public decimal? Length { get; set; }

        /// <summary>
        /// Tip size in millimeters
        /// </summary>
        public decimal? TipSize { get; set; }

        /// <summary>
        /// Shaft material (e.g., maple, carbon fiber)
        /// </summary>
        public string? ShaftMaterial { get; set; }

        /// <summary>
        /// Wrap material (e.g., leather, Irish linen)
        /// </summary>
        public string? WrapMaterial { get; set; }

        /// <summary>
        /// Year of manufacture
        /// </summary>
        public int? ManufactureYear { get; set; }

        /// <summary>
        /// Condition of the cue (mint, excellent, good, fair, poor)
        /// </summary>
        public string Condition { get; set; } = "good";

        /// <summary>
        /// Location where cue is located/available
        /// </summary>
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Whether the cue has been sold
        /// </summary>
        public bool IsSold { get; set; } = false;

        /// <summary>
        /// Date when the cue was sold (if applicable)
        /// </summary>
        public DateTime? SoldDate { get; set; }

        /// <summary>
        /// ID of the user who posted this cue
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// User who posted this cue (navigation property)
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// View count for analytics
        /// </summary>
        public int ViewCount { get; set; } = 0;

        /// <summary>
        /// Average rating for this cue
        /// </summary>
        public decimal AverageRating { get; set; } = 0;

        /// <summary>
        /// Number of ratings this cue has received
        /// </summary>
        public int RatingCount { get; set; } = 0;

        /// <summary>
        /// Listing creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }

        // Moderation properties
        /// <summary>
        /// Whether this cue listing has been flagged for moderation
        /// </summary>
        public bool IsFlagged { get; set; } = false;

        /// <summary>
        /// Reason for flagging (spam, inappropriate, scam, etc.)
        /// </summary>
        public string? FlagReason { get; set; }

        /// <summary>
        /// Moderation status: approved, pending, rejected, hidden
        /// </summary>
        public string ModerationStatus { get; set; } = "approved";

        /// <summary>
        /// ID of moderator who reviewed this listing
        /// </summary>
        public int? ModeratedByUserId { get; set; }

        /// <summary>
        /// Timestamp when the listing was moderated
        /// </summary>
        public DateTime? ModeratedAt { get; set; }

        /// <summary>
        /// Moderator notes about this listing
        /// </summary>
        public string? ModerationNotes { get; set; }

        /// <summary>
        /// Images associated with this cue
        /// </summary>
        public virtual ICollection<CueImage>? Images { get; set; }

        /// <summary>
        /// Seller reviews received on this cue (via Ratings table)
        /// </summary>
        public virtual ICollection<Rating>? Ratings { get; set; }

        /// <summary>
        /// Users who have saved this cue
        /// </summary>
        public virtual ICollection<SavedCue>? SavedByUsers { get; set; }

        // Old listing management fields
        /// <summary>
        /// Last time the user was prompted about this listing
        /// </summary>
        public DateTime? LastPromptedAt { get; set; }

        /// <summary>
        /// Last time the user responded to a prompt about this listing
        /// </summary>
        public DateTime? LastUserResponseAt { get; set; }

        /// <summary>
        /// Whether this listing is hidden due to inactivity
        /// </summary>
        public bool IsHidden { get; set; } = false;

        /// <summary>
        /// When this listing was hidden (if applicable)
        /// </summary>
        public DateTime? HiddenAt { get; set; }
    }
}
