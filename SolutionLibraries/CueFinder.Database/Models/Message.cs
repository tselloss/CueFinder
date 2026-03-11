namespace CueFinder.Database.Models
{
    /// <summary>
    /// Message/Conversation between users
    /// </summary>
    public class Message
    {
        /// <summary>
        /// Unique message identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the user sending the message. Null for system/app notifications.
        /// </summary>
        public int? SenderId { get; set; }

        /// <summary>
        /// User sending the message (navigation property)
        /// </summary>
        public virtual User? Sender { get; set; }

        /// <summary>
        /// True when sent by the platform (raffle notifications, etc.).
        /// Users cannot reply to system messages.
        /// </summary>
        public bool IsSystem { get; set; } = false;

        /// <summary>
        /// ID of the user receiving the message
        /// </summary>
        public int RecipientId { get; set; }

        /// <summary>
        /// User receiving the message (navigation property)
        /// </summary>
        public virtual User? Recipient { get; set; }

        /// <summary>
        /// ID of the related cue (if applicable)
        /// </summary>
        public int? CueId { get; set; }

        /// <summary>
        /// Related cue (navigation property)
        /// </summary>
        public virtual Cue? Cue { get; set; }

        /// <summary>
        /// Message subject/title
        /// </summary>
        public string Subject { get; set; } = string.Empty;

        /// <summary>
        /// Message content
        /// </summary>
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// Whether the recipient has read this message
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// Timestamp when the message was read
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// Message creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Message type (inquiry, offer, accepted, rejected, etc.)
        /// </summary>
        public string MessageType { get; set; } = "message"; // message, inquiry, offer, negotiation, accepted, rejected

        // Moderation properties
        /// <summary>
        /// Whether this message has been flagged for moderation
        /// </summary>
        public bool IsFlagged { get; set; } = false;

        /// <summary>
        /// Reason for flagging (spam, inappropriate, harassment, etc.)
        /// </summary>
        public string? FlagReason { get; set; }

        /// <summary>
        /// Moderation status: approved, pending, rejected, hidden
        /// </summary>
        public string ModerationStatus { get; set; } = "approved";

        /// <summary>
        /// ID of moderator who reviewed this message
        /// </summary>
        public int? ModeratedByUserId { get; set; }

        /// <summary>
        /// Timestamp when the message was moderated
        /// </summary>
        public DateTime? ModeratedAt { get; set; }

        /// <summary>
        /// Moderator notes about this message
        /// </summary>
        public string? ModerationNotes { get; set; }
    }
}
