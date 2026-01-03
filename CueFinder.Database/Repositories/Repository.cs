using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Repositories
{
    /// <summary>
    /// Generic repository implementation for CRUD operations
    /// </summary>
    public class Repository<T> : IRepository<T> where T : class
    {
        private readonly CueFinderDbContext _context;
        private readonly DbSet<T> _dbSet;
        private readonly ILogger<Repository<T>> _logger;

        public Repository(CueFinderDbContext context, ILogger<Repository<T>> logger)
        {
            _context = context;
            _dbSet = context.Set<T>();
            _logger = logger;
        }

        /// <summary>
        /// Get entity by ID
        /// </summary>
        public async Task<T?> GetByIdAsync(int id)
        {
            try
            {
                return await _dbSet.FindAsync(id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving {Entity} with ID {Id}", typeof(T).Name, id);
                throw;
            }
        }

        /// <summary>
        /// Get all entities
        /// </summary>
        public async Task<List<T>> GetAllAsync()
        {
            try
            {
                return await _dbSet.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all {Entity} records", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Add new entity
        /// </summary>
        public async Task<T> AddAsync(T entity)
        {
            try
            {
                await _dbSet.AddAsync(entity);
                await _context.SaveChangesAsync();
                _logger.LogInformation("{Entity} added successfully", typeof(T).Name);
                return entity;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding {Entity}", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Update existing entity
        /// </summary>
        public async Task<T> UpdateAsync(T entity)
        {
            try
            {
                _dbSet.Update(entity);
                await _context.SaveChangesAsync();
                _logger.LogInformation("{Entity} updated successfully", typeof(T).Name);
                return entity;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating {Entity}", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Delete entity by ID
        /// </summary>
        public async Task<bool> DeleteAsync(int id)
        {
            try
            {
                var entity = await _dbSet.FindAsync(id);
                if (entity == null)
                {
                    return false;
                }

                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
                _logger.LogInformation("{Entity} with ID {Id} deleted successfully", typeof(T).Name, id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting {Entity} with ID {Id}", typeof(T).Name, id);
                throw;
            }
        }

        /// <summary>
        /// Delete entity
        /// </summary>
        public async Task<bool> DeleteAsync(T entity)
        {
            try
            {
                _dbSet.Remove(entity);
                await _context.SaveChangesAsync();
                _logger.LogInformation("{Entity} deleted successfully", typeof(T).Name);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting {Entity}", typeof(T).Name);
                throw;
            }
        }

        /// <summary>
        /// Save changes to database
        /// </summary>
        public async Task SaveChangesAsync()
        {
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving changes to database");
                throw;
            }
        }
    }
}
