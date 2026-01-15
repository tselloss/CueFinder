namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a new post/reply is added to a discussion
/// </summary>
public record PostCreatedEvent
{
    public Guid PostId { get; set; }
    
    public Guid DiscussionId { get; set; }
    
    public string Content { get; set; } = string.Empty;
    
    public Guid CreatedByUserId { get; set; }
    
    public Guid? ReplyToPostId { get; set; }
    
    public List<Guid> MentionedUserIds { get; set; } = new();
    
    public DateTime CreatedAt { get; set; }
}
