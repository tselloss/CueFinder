namespace CueFinder.Database.Models
{
    /// <summary>
    /// Represents a flagged image in the moderation system
    /// </summary>
    public class FlaggedImage
    {
        /// <summary>
        /// Unique identifier for the flagged image record
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// The image hash (perceptual hash) to block similar re-uploads
        /// </summary>
        public string ImageHash { get; set; } = string.Empty;

        /// <summary>
        /// Original filename
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Path where the flagged image is stored (not public)
        /// </summary>
        public string StoragePath { get; set; } = string.Empty;

        /// <summary>
        /// Related CueId if this is a cue image
        /// </summary>
        public int? CueId { get; set; }

        /// <summary>
        /// Related CueCaseId if this is a case image
        /// </summary>
        public int? CueCaseId { get; set; }

        /// <summary>
        /// User who uploaded the image
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Reason for flagging: "nudity", "violence", "weapons", "other"
        /// </summary>
        public string FlagReason { get; set; } = "other";

        /// <summary>
        /// AI confidence score (0-1) - null if manually flagged
        /// </summary>
        public double? AIConfidenceScore { get; set; }

        /// <summary>
        /// Whether flagged by AI or manually by user
        /// </summary>
        public bool IsAIFlagged { get; set; } = true;

        /// <summary>
        /// Current status: "pending", "approved", "rejected", "appealed"
        /// </summary>
        public string Status { get; set; } = "pending";

        /// <summary>
        /// Admin notes about the decision
        /// </summary>
        public string? AdminNotes { get; set; }

        /// <summary>
        /// Admin user who made the decision
        /// </summary>
        public int? AdminUserId { get; set; }

        /// <summary>
        /// Timestamp when image was flagged
        /// </summary>
        public DateTime FlaggedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Timestamp when moderation decision was made
        /// </summary>
        public DateTime? ReviewedAt { get; set; }

        /// <summary>
        /// Related user (navigation property)
        /// </summary>
        public User? User { get; set; }

        /// <summary>
        /// Related admin user (navigation property)
        /// </summary>
        public User? AdminUser { get; set; }
    }
}
