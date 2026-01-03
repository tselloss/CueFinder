namespace CueFinder.Models
{
    /// <summary>
    /// Search/Query filter model for cue listings
    /// </summary>
    public class CueSearchFilter
    {
        /// <summary>
        /// Search query string (title, brand, description)
        /// </summary>
        public string? Query { get; set; }

        /// <summary>
        /// Minimum price filter
        /// </summary>
        public decimal? MinPrice { get; set; }

        /// <summary>
        /// Maximum price filter
        /// </summary>
        public decimal? MaxPrice { get; set; }

        /// <summary>
        /// Filter by brand
        /// </summary>
        public string? Brand { get; set; }

        /// <summary>
        /// Filter by cue type
        /// </summary>
        public string? CueType { get; set; }

        /// <summary>
        /// Filter by condition
        /// </summary>
        public string? Condition { get; set; }

        /// <summary>
        /// Filter by location
        /// </summary>
        public string? Location { get; set; }

        /// <summary>
        /// Filter by shaft material
        /// </summary>
        public string? ShaftMaterial { get; set; }

        /// <summary>
        /// Filter by wrap material
        /// </summary>
        public string? WrapMaterial { get; set; }

        /// <summary>
        /// Minimum weight filter
        /// </summary>
        public decimal? MinWeight { get; set; }

        /// <summary>
        /// Maximum weight filter
        /// </summary>
        public decimal? MaxWeight { get; set; }

        /// <summary>
        /// Minimum length filter
        /// </summary>
        public decimal? MinLength { get; set; }

        /// <summary>
        /// Maximum length filter
        /// </summary>
        public decimal? MaxLength { get; set; }

        /// <summary>
        /// Filter for sold items (true/false/null for all)
        /// </summary>
        public bool? IsSold { get; set; } = false;

        /// <summary>
        /// Minimum rating filter
        /// </summary>
        public decimal? MinRating { get; set; }

        /// <summary>
        /// Sort field (price, rating, created, views, etc.)
        /// </summary>
        public string SortBy { get; set; } = "created";

        /// <summary>
        /// Sort direction (asc/desc)
        /// </summary>
        public string SortDirection { get; set; } = "desc";

        /// <summary>
        /// Page number (1-based)
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Items per page
        /// </summary>
        public int PageSize { get; set; } = 20;

        /// <summary>
        /// Filter by user ID (for seller's listings)
        /// </summary>
        public int? UserId { get; set; }
    }
}
