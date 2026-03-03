namespace CueFinder.Messages.Models
{
    /// <summary>
    /// Transport-friendly message view for API and SignalR payloads.
    /// </summary>
    public class MessageResponseDto
    {
        public int Id { get; set; }
        public int? SenderId { get; set; }
        public string SenderName { get; set; } = string.Empty;
        public bool IsSystem { get; set; } = false;
        public int RecipientId { get; set; }
        public string RecipientName { get; set; } = string.Empty;
        public int? CueId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string MessageType { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
