using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository interface for Discussion entity with specific queries
/// </summary>
public interface IDiscussionRepository : IRepository<Discussion>
{
    Task<IEnumerable<Discussion>> GetByCategoryAsync(Guid categoryId);
    Task<IEnumerable<Discussion>> GetByUserAsync(Guid userId);
    Task<IEnumerable<Discussion>> GetPinnedAsync();
    Task<Discussion?> GetWithPostsAsync(Guid id);
    Task<IEnumerable<Discussion>> SearchAsync(string searchTerm);
}
