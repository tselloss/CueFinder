using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Generic repository interface for forum entities
/// </summary>
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(Guid id);
    Task<IEnumerable<T>> GetAllAsync();
    Task<IEnumerable<T>> FindAsync(Func<T, bool> predicate);
    Task<T> AddAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task<bool> DeleteAsync(Guid id);
    Task<int> SaveChangesAsync();
}
