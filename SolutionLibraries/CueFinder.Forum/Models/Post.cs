namespace CueFinder.Forum.Models;

/// <summary>
/// Represents a post/reply within a discussion
/// </summary>
public class Post
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Content { get; set; } = string.Empty;
    
    public Guid DiscussionId { get; set; }
    
    public Guid CreatedByUserId { get; set; }
    
    public string CreatedByUsername { get; set; } = "User";
    
    public Guid? ReplyToPostId { get; set; }
    
    public int LikeCount { get; set; }
    
    public int HelpfulCount { get; set; }
    
    public bool IsEdited { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime ModifiedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? DeletedAt { get; set; }
    
    public string? DeletionReason { get; set; }

    // Navigation properties
    public Discussion? Discussion { get; set; }
    
    public Post? ReplyToPost { get; set; }
    
    public ICollection<Post> Replies { get; set; } = new List<Post>();
    
    public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
    
    public ICollection<PostMention> Mentions { get; set; } = new List<PostMention>();
}
