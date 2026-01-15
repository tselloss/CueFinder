using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository implementation for PostLike entity
/// </summary>
public class LikeRepository : Repository<PostLike>, ILikeRepository
{
    public LikeRepository(ForumDbContext context) : base(context) { }

    public async Task<IEnumerable<PostLike>> GetByPostAsync(Guid postId)
    {
        return await _dbSet
            .Where(l => l.PostId == postId)
            .ToListAsync();
    }

    public async Task<IEnumerable<PostLike>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync();
    }

    public async Task<PostLike?> GetLikeAsync(Guid postId, Guid userId)
    {
        return await _dbSet
            .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
    }

    public async Task<int> GetLikeCountAsync(Guid postId)
    {
        return await _dbSet
            .Where(l => l.PostId == postId)
            .CountAsync();
    }
}
