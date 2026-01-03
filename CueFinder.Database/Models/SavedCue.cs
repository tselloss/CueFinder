namespace CueFinder.Database.Models
{
    /// <summary>
    /// Saved/Favorited cue by a user
    /// </summary>
    public class SavedCue
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the user who saved the cue
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// User who saved the cue (navigation property)
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// ID of the saved cue
        /// </summary>
        public int CueId { get; set; }

        /// <summary>
        /// Saved cue (navigation property)
        /// </summary>
        public virtual Cue? Cue { get; set; }

        /// <summary>
        /// Timestamp when the cue was saved
        /// </summary>
        public DateTime SavedAt { get; set; }

        /// <summary>
        /// Optional note/comment about the saved cue
        /// </summary>
        public string? Note { get; set; }
    }
}
