using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository interface for Post entity with specific queries
/// </summary>
public interface IPostRepository : IRepository<Post>
{
    Task<IEnumerable<Post>> GetByDiscussionAsync(Guid discussionId);
    Task<IEnumerable<Post>> GetByUserAsync(Guid userId);
    Task<IEnumerable<Post>> GetRepliesAsync(Guid postId);
    Task<Post?> GetWithMentionsAsync(Guid id);
    Task<int> GetPostCountByUserAsync(Guid userId);
}
