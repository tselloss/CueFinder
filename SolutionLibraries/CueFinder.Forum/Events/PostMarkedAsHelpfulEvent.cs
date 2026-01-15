namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a post is marked as helpful
/// </summary>
public record PostMarkedAsHelpfulEvent
{
    public Guid PostId { get; set; }
    
    public Guid DiscussionId { get; set; }
    
    public Guid MarkedByUserId { get; set; }
    
    public Guid PostOwnerUserId { get; set; }
    
    public int TotalHelpful { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
