namespace CueFinder.Database.Models
{
    /// <summary>
    /// Billiard table listing entity
    /// </summary>
    public class BilliardTable
    {
        /// <summary>
        /// Unique table identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Title/Name of the table
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Brand/Manufacturer of the table (e.g., Brunswick, Olhausen, etc.)
        /// </summary>
        public string Brand { get; set; } = string.Empty;

        /// <summary>
        /// Detailed description of the table
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Price in dollars
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Table size (e.g., 7-foot, 8-foot, 9-foot, 10-foot)
        /// </summary>
        public string TableSize { get; set; } = "8-foot";

        /// <summary>
        /// Type of table (pool, snooker, billiards, combination)
        /// </summary>
        public string TableType { get; set; } = "pool";

        /// <summary>
        /// Playing surface material (slate, hybrid, synthetic)
        /// </summary>
        public string PlayingSurface { get; set; } = string.Empty;

        /// <summary>
        /// Felt/Cloth type and color
        /// </summary>
        public string FeltType { get; set; } = string.Empty;

        /// <summary>
        /// Frame/Leg material (wood, metal, etc.)
        /// </summary>
        public string FrameMaterial { get; set; } = string.Empty;

        /// <summary>
        /// Pockets type (leather, rubber, or none)
        /// </summary>
        public string? PocketType { get; set; }

        /// <summary>
        /// Special features (lights, scoring unit, leg levelers, etc.)
        /// </summary>
        public string? Features { get; set; }

        /// <summary>
        /// Year of manufacture
        /// </summary>
        public int? ManufactureYear { get; set; }

        /// <summary>
        /// Condition of the table (mint, excellent, good, fair, poor)
        /// </summary>
        public string Condition { get; set; } = "good";

        /// <summary>
        /// Location where table is located/available
        /// </summary>
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Whether the table has been sold
        /// </summary>
        public bool IsSold { get; set; } = false;

        /// <summary>
        /// Date when the table was sold (if applicable)
        /// </summary>
        public DateTime? SoldDate { get; set; }

        /// <summary>
        /// ID of the user who posted this table
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// User who posted this table (navigation property)
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// View count for analytics
        /// </summary>
        public int ViewCount { get; set; } = 0;

        /// <summary>
        /// Average rating for this table
        /// </summary>
        public decimal AverageRating { get; set; } = 0;

        /// <summary>
        /// Number of ratings this table has received
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
        /// Whether this table listing has been flagged for moderation
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
        /// Images associated with this table
        /// </summary>
        public virtual ICollection<BilliardTableImage>? Images { get; set; }

        /// <summary>
        /// Ratings for this table
        /// </summary>
        public virtual ICollection<Rating>? Ratings { get; set; }

        /// <summary>
        /// Users who have saved this table
        /// </summary>
        public virtual ICollection<SavedBilliardTable>? SavedByUsers { get; set; }
    }
}
