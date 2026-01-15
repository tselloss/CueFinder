namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a user's like on a post
/// </summary>
public class PostLike
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid PostId { get; set; }
    
    public Guid UserId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Post? Post { get; set; }
}
