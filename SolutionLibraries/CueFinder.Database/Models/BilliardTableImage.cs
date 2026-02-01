namespace CueFinder.Database.Models
{
    /// <summary>
    /// Image associated with a billiard table listing
    /// </summary>
    public class BilliardTableImage
    {
        /// <summary>
        /// Unique image identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the billiard table this image belongs to
        /// </summary>
        public int BilliardTableId { get; set; }

        /// <summary>
        /// Billiard table this image belongs to (navigation property)
        /// </summary>
        public virtual BilliardTable? BilliardTable { get; set; }

        /// <summary>
        /// URL/path to the image
        /// </summary>
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Whether this is the primary/featured image
        /// </summary>
        public bool IsPrimary { get; set; } = false;

        /// <summary>
        /// Display order for images
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>
        /// When the image was uploaded
        /// </summary>
        public DateTime CreatedAt { get; set; }
    }
}
