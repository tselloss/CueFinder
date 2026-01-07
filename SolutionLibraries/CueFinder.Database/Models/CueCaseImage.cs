namespace CueFinder.Database.Models
{
    /// <summary>
    /// Image associated with a cue case listing
    /// </summary>
    public class CueCaseImage
    {
        public int Id { get; set; }
        
        /// <summary>
        /// Foreign key to CueCase
        /// </summary>
        public int CueCaseId { get; set; }
        
        /// <summary>
        /// URL or path to the image
        /// </summary>
        public string ImageUrl { get; set; } = string.Empty;
        
        /// <summary>
        /// Order/position of the image in the gallery
        /// </summary>
        public int DisplayOrder { get; set; }
        
        /// <summary>
        /// Whether this is the primary/featured image
        /// </summary>
        public bool IsPrimary { get; set; }
        
        /// <summary>
        /// Upload timestamp
        /// </summary>
        public DateTime UploadedAt { get; set; }
        
        /// <summary>
        /// Navigation property to parent CueCase
        /// </summary>
        public virtual CueCase? CueCase { get; set; }
    }
}
