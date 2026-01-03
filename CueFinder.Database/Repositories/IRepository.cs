using CueFinder.Database.Models;

namespace CueFinder.Database.Repositories
{
    /// <summary>
    /// Generic repository interface for CRUD operations
    /// </summary>
    public interface IRepository<T> where T : class
    {
        Task<T?> GetByIdAsync(int id);
        Task<List<T>> GetAllAsync();
        Task<T> AddAsync(T entity);
        Task<T> UpdateAsync(T entity);
        Task<bool> DeleteAsync(int id);
        Task<bool> DeleteAsync(T entity);
        Task SaveChangesAsync();
    }
}
