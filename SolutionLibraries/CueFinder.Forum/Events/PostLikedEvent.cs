namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a post is liked
/// </summary>
public record PostLikedEvent
{
    public Guid PostId { get; set; }
    
    public Guid DiscussionId { get; set; }
    
    public Guid LikedByUserId { get; set; }
    
    public Guid PostOwnerUserId { get; set; }
    
    public int TotalLikes { get; set; }
    
    public DateTime CreatedAt { get; set; }
}
