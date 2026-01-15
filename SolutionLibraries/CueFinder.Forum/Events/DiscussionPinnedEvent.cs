namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a discussion is pinned
/// </summary>
public record DiscussionPinnedEvent
{
    public Guid DiscussionId { get; set; }
    
    public string Title { get; set; } = string.Empty;
    
    public Guid PinnedByUserId { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
