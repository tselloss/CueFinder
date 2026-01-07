namespace CueFinder.Database.Models
{
    /// <summary>
    /// Cue case listing entity
    /// </summary>
    public class CueCase
    {
        /// <summary>
        /// Unique case identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Title/Name of the case
        /// </summary>
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// Brand of the case
        /// </summary>
        public string Brand { get; set; } = string.Empty;

        /// <summary>
        /// Detailed description of the case
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Price in dollars
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>
        /// Case capacity (e.g., 1x1, 1x2, 2x4, 3x5, 4x8)
        /// </summary>
        public string CaseCapacity { get; set; } = string.Empty;

        /// <summary>
        /// Opening type (Butterfly, Top Open, Side Open, Zipper)
        /// </summary>
        public string CaseOpening { get; set; } = string.Empty;

        /// <summary>
        /// Case type (Soft, Hard, Semi-Hard)
        /// </summary>
        public string CaseType { get; set; } = string.Empty;

        /// <summary>
        /// Color of the case
        /// </summary>
        public string? Color { get; set; }

        /// <summary>
        /// Case material (e.g., leather, vinyl, nylon)
        /// </summary>
        public string? CaseMaterial { get; set; }

        /// <summary>
        /// Outer dimensions of the case
        /// </summary>
        public string? OuterDimensions { get; set; }

        /// <summary>
        /// Pocket space (None, Small, Medium, Large, Very Large)
        /// </summary>
        public string? PocketSpace { get; set; }

        /// <summary>
        /// Handle/Extension space description
        /// </summary>
        public string? HandleExtensionSpace { get; set; }

        /// <summary>
        /// Weight of the case
        /// </summary>
        public string? CaseWeight { get; set; }

        /// <summary>
        /// Condition of the case (mint, excellent, good, fair, poor)
        /// </summary>
        public string Condition { get; set; } = string.Empty;

        /// <summary>
        /// Location where case is located/available
        /// </summary>
        public string Location { get; set; } = string.Empty;

        /// <summary>
        /// Whether the case has been sold
        /// </summary>
        public bool IsSold { get; set; } = false;

        /// <summary>
        /// Date when the case was sold (if applicable)
        /// </summary>
        public DateTime? SoldDate { get; set; }

        /// <summary>
        /// ID of the user who posted this case
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// User who posted this case (navigation property)
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// View count for analytics
        /// </summary>
        public int ViewCount { get; set; } = 0;

        /// <summary>
        /// Average rating for this case
        /// </summary>
        public decimal AverageRating { get; set; } = 0;

        /// <summary>
        /// Number of ratings this case has received
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

        /// <summary>
        /// Images associated with this case
        /// </summary>
        public virtual ICollection<CueCaseImage>? Images { get; set; }
    }
}
