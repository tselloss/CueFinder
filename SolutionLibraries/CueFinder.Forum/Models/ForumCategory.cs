namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a forum category that groups discussions by topic
/// </summary>
public class ForumCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public int DisplayOrder { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Discussion> Discussions { get; set; } = new List<Discussion>();
}
