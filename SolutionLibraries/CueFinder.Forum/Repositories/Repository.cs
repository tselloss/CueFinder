using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Generic repository implementation for forum entities
/// </summary>
public class Repository<T> : IRepository<T> where T : class
{
    protected readonly ForumDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(ForumDbContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<T?> GetByIdAsync(Guid id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<IEnumerable<T>> FindAsync(Func<T, bool> predicate)
    {
        return await Task.FromResult(_dbSet.Where(predicate).ToList());
    }

    public async Task<T> AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        return entity;
    }

    public async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        return await Task.FromResult(entity);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var entity = await GetByIdAsync(id);
        if (entity == null) return false;

        _dbSet.Remove(entity);
        return true;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }
}
