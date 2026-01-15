using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository interface for PostMention entity
/// </summary>
public interface IMentionRepository : IRepository<PostMention>
{
    Task<IEnumerable<PostMention>> GetByPostAsync(Guid postId);
    Task<IEnumerable<PostMention>> GetByUserAsync(Guid userId);
}
