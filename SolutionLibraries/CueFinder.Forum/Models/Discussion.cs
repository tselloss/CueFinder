namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a forum discussion/thread
/// </summary>
public class Discussion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Title { get; set; } = string.Empty;
    
    public string Content { get; set; } = string.Empty;
    
    public Guid CreatedByUserId { get; set; }
    
    public string CreatedByUsername { get; set; } = "User";
    
    public Guid CategoryId { get; set; }
    
    public int ViewCount { get; set; }
    
    public int ReplyCount { get; set; }
    
    public bool IsPinned { get; set; }
    
    public bool IsLocked { get; set; }
    
    // Moderation properties
    public bool IsFlagged { get; set; } = false;
    
    public string? FlagReason { get; set; }
    
    public string ModerationStatus { get; set; } = "approved"; // approved, pending, rejected, hidden
    
    public Guid? ModeratedByUserId { get; set; }
    
    public DateTime? ModeratedAt { get; set; }
    
    public string? ModerationNotes { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastReplyAt { get; set; }

    // Navigation properties
    public ForumCategory? Category { get; set; }
    
    public ICollection<Post> Posts { get; set; } = new List<Post>();
    
    public ICollection<DiscussionView> Views { get; set; } = new List<DiscussionView>();
    
    public ICollection<DiscussionSubscription> Subscriptions { get; set; } = new List<DiscussionSubscription>();
}
