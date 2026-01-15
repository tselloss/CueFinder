namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a discussion is locked
/// </summary>
public record DiscussionLockedEvent
{
    public Guid DiscussionId { get; set; }
    
    public string Title { get; set; } = string.Empty;
    
    public Guid LockedByUserId { get; set; }
    
    public string? Reason { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
