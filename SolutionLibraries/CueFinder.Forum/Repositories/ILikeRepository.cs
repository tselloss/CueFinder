using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository interface for PostLike entity
/// </summary>
public interface ILikeRepository : IRepository<PostLike>
{
    Task<IEnumerable<PostLike>> GetByPostAsync(Guid postId);
    Task<IEnumerable<PostLike>> GetByUserAsync(Guid userId);
    Task<PostLike?> GetLikeAsync(Guid postId, Guid userId);
    Task<int> GetLikeCountAsync(Guid postId);
}
