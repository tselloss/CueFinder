namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a user's subscription to a discussion for notifications
/// </summary>
public class DiscussionSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid DiscussionId { get; set; }
    
    public Guid UserId { get; set; }
    
    public bool NotifyOnNewPost { get; set; } = true;
    
    public bool NotifyOnMention { get; set; } = true;
    
    public DateTime SubscribedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Discussion? Discussion { get; set; }
}
