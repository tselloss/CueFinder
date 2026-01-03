namespace CueFinder.Models
{
    /// <summary>
    /// User rating/review for a cue listing
    /// </summary>
    public class Rating
    {
        /// <summary>
        /// Unique rating identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the cue being rated
        /// </summary>
        public int CueId { get; set; }

        /// <summary>
        /// Cue being rated (navigation property)
        /// </summary>
        public virtual Cue? Cue { get; set; }

        /// <summary>
        /// ID of the user giving the rating
        /// </summary>
        public int RatedByUserId { get; set; }

        /// <summary>
        /// User giving the rating (navigation property)
        /// </summary>
        public virtual User? RatedByUser { get; set; }

        /// <summary>
        /// ID of the seller being rated
        /// </summary>
        public int SellerUserId { get; set; }

        /// <summary>
        /// Seller being rated (navigation property)
        /// </summary>
        public virtual User? SellerUser { get; set; }

        /// <summary>
        /// Rating value (1-5 stars)
        /// </summary>
        public int Rating { get; set; }

        /// <summary>
        /// Review text
        /// </summary>
        public string? ReviewText { get; set; }

        /// <summary>
        /// Rating categories for detailed feedback
        /// </summary>
        public string? Category { get; set; } // "accuracy", "communication", "shipping", "condition", etc.

        /// <summary>
        /// Rating creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
