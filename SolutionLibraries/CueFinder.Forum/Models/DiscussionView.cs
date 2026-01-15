namespace CueFinder.Forum.Models;

/// <summary>
/// Tracks discussion views by users
/// </summary>
public class DiscussionView
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid DiscussionId { get; set; }
    
    public Guid UserId { get; set; }
    
    public DateTime ViewedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Discussion? Discussion { get; set; }
}
