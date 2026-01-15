namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a user is mentioned in a post
/// </summary>
public record UserMentionedEvent
{
    public Guid PostId { get; set; }
    
    public Guid DiscussionId { get; set; }
    
    public Guid MentionedUserId { get; set; }
    
    public Guid MentionedByUserId { get; set; }
    
    public string PostContent { get; set; } = string.Empty;
    
    public string DiscussionTitle { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
}
