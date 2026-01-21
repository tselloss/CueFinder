namespace CueFinder.Database.Models
{
    /// <summary>
    /// Tracks moderation queue items for admin review
    /// </summary>
    public class ModerationQueue
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Reference to the FlaggedImage
        /// </summary>
        public int FlaggedImageId { get; set; }

        /// <summary>
        /// Priority level: 1 (high), 2 (medium), 3 (low)
        /// </summary>
        public int Priority { get; set; } = 2;

        /// <summary>
        /// Number of user reports for this image
        /// </summary>
        public int UserReportCount { get; set; } = 0;

        /// <summary>
        /// Is this currently being reviewed by an admin
        /// </summary>
        public bool IsBeingReviewed { get; set; } = false;

        /// <summary>
        /// Admin user currently reviewing (if any)
        /// </summary>
        public int? ReviewingAdminId { get; set; }

        /// <summary>
        /// When the admin started reviewing
        /// </summary>
        public DateTime? ReviewStartedAt { get; set; }

        /// <summary>
        /// When this was added to the queue
        /// </summary>
        public DateTime AddedToQueueAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Navigation to FlaggedImage
        /// </summary>
        public FlaggedImage? FlaggedImage { get; set; }

        /// <summary>
        /// Navigation to reviewing admin user
        /// </summary>
        public User? ReviewingAdmin { get; set; }
    }
}
