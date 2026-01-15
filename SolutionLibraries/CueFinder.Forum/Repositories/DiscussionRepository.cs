using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository implementation for Discussion entity
/// </summary>
public class DiscussionRepository : Repository<Discussion>, IDiscussionRepository
{
    public DiscussionRepository(ForumDbContext context) : base(context) { }

    public async Task<IEnumerable<Discussion>> GetByCategoryAsync(Guid categoryId)
    {
        return await _dbSet
            .Where(d => d.CategoryId == categoryId && !d.IsLocked)
            .OrderByDescending(d => d.IsPinned)
            .ThenByDescending(d => d.LastReplyAt ?? d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Discussion>> GetByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(d => d.CreatedByUserId == userId)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Discussion>> GetPinnedAsync()
    {
        return await _dbSet
            .Where(d => d.IsPinned)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }

    public async Task<Discussion?> GetWithPostsAsync(Guid id)
    {
        return await _dbSet
            .Include(d => d.Category)
            .Include(d => d.Posts)
            .FirstOrDefaultAsync(d => d.Id == id);
    }

    public async Task<IEnumerable<Discussion>> SearchAsync(string searchTerm)
    {
        return await _dbSet
            .Where(d => d.Title.Contains(searchTerm) || d.Content.Contains(searchTerm))
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();
    }
}
