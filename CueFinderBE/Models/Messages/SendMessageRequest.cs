using System.ComponentModel.DataAnnotations;

namespace CueFinderBE.Models.Messages
{
    /// <summary>
    /// Payload to send a new user-to-user message.
    /// </summary>
    public class SendMessageRequest
    {
        [Required]
        public int RecipientId { get; set; }

        /// <summary>
        /// Optional cue listing the message is about.
        /// </summary>
        public int? CueId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [MaxLength(4000)]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// message, inquiry, offer, negotiation, accepted, rejected
        /// </summary>
        [MaxLength(50)]
        public string MessageType { get; set; } = "message";
    }
}
