namespace CueFinder.Models
{
    /// <summary>
    /// Image associated with a cue listing
    /// </summary>
    public class CueImage
    {
        /// <summary>
        /// Unique image identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the cue this image belongs to
        /// </summary>
        public int CueId { get; set; }

        /// <summary>
        /// Cue this image belongs to (navigation property)
        /// </summary>
        public virtual Cue? Cue { get; set; }

        /// <summary>
        /// URL of the image
        /// </summary>
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Alt text for accessibility
        /// </summary>
        public string? AltText { get; set; }

        /// <summary>
        /// Display order of the image in the gallery
        /// </summary>
        public int DisplayOrder { get; set; } = 0;

        /// <summary>
        /// Whether this is the primary/thumbnail image
        /// </summary>
        public bool IsPrimary { get; set; } = false;

        /// <summary>
        /// Image upload timestamp
        /// </summary>
        public DateTime UploadedAt { get; set; }
    }
}
