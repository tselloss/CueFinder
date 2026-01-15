using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository implementation for Post entity
/// </summary>
public class PostRepository : Repository<Post>, IPostRepository
{
    public PostRepository(ForumDbContext context) : base(context) { }

    public async Task<IEnumerable<Post>> GetByDiscussionAsync(Guid discussionId)
    {
        return await _dbSet
            .Where(p => p.DiscussionId == discussionId && p.DeletedAt == null)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Post>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(p => p.CreatedByUserId == userId && p.DeletedAt == null)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Post>> GetRepliesAsync(Guid postId)
    {
        return await _dbSet
            .Where(p => p.ReplyToPostId == postId && p.DeletedAt == null)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Post?> GetWithMentionsAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Discussion)
            .Include(p => p.Mentions)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<int> GetPostCountByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(p => p.CreatedByUserId == userId && p.DeletedAt == null)
            .CountAsync();
    }
}
