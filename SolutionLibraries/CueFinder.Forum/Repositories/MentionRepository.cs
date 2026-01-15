using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository implementation for PostMention entity
/// </summary>
public class MentionRepository : Repository<PostMention>, IMentionRepository
{
    public MentionRepository(ForumDbContext context) : base(context) { }

    public async Task<IEnumerable<PostMention>> GetByPostAsync(Guid postId)
    {
        return await _dbSet
            .Where(m => m.PostId == postId)
            .ToListAsync();
    }

    public async Task<IEnumerable<PostMention>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(m => m.MentionedUserId == userId)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();
    }
}
