namespace CueFinder.Models
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
        /// ID of the user sending the message
        /// </summary>
        public int SenderId { get; set; }

        /// <summary>
        /// User sending the message (navigation property)
        /// </summary>
        public virtual User? Sender { get; set; }

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
    }
}
