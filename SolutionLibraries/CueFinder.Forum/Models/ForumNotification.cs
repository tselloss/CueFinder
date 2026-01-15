namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a notification for forum activities
/// </summary>
public class ForumNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid UserId { get; set; }
    
    public string Type { get; set; } = string.Empty; // ReplyAdded, Mentioned, DiscussionLocked, etc.
    
    public string Title { get; set; } = string.Empty;
    
    public string Message { get; set; } = string.Empty;
    
    public Guid? DiscussionId { get; set; }
    
    public Guid? PostId { get; set; }
    
    public Guid? TriggeredByUserId { get; set; }
    
    public bool IsRead { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? ReadAt { get; set; }
    
    public DateTime? ExpiresAt { get; set; }

    public enum NotificationType
    {
        ReplyAdded,
        Mentioned,
        DiscussionLocked,
        DiscussionPinned,
        PostLiked,
        PostMarkedAsHelpful,
        DiscussionClosed
    }
}
