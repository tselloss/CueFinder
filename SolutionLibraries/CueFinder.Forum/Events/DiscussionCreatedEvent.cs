namespace CueFinder.Forum.Events;

/// <summary>
/// Event published when a new discussion is created
/// </summary>
public record DiscussionCreatedEvent
{
    public Guid DiscussionId { get; set; }
    
    public string Title { get; set; } = string.Empty;
    
    public Guid CreatedByUserId { get; set; }
    
    public Guid CategoryId { get; set; }
    
    public string CategoryName { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
}
