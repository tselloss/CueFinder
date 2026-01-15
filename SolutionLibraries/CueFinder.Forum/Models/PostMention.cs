namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a user mention in a post
/// </summary>
public class PostMention
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PostId { get; set; }
    
    public Guid MentionedUserId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Post? Post { get; set; }
}
