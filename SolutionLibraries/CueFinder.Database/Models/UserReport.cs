namespace CueFinder.Database.Models
{
    /// <summary>
    /// Tracks user reports of flagged content
    /// </summary>
    public class UserReport
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// User who reported the content
        /// </summary>
        public int ReportingUserId { get; set; }

        /// <summary>
        /// FlaggedImage being reported
        /// </summary>
        public int FlaggedImageId { get; set; }

        /// <summary>
        /// Report reason from user
        /// </summary>
        public string ReportReason { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp of report
        /// </summary>
        public DateTime ReportedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation to reporting user
        /// </summary>
        public User? ReportingUser { get; set; }

        /// <summary>
        /// Navigation to flagged image
        /// </summary>
        public FlaggedImage? FlaggedImage { get; set; }
    }
}
