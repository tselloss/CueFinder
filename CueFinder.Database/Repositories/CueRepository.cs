using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Repositories
{
    /// <summary>
    /// Repository interface for Cue operations
    /// </summary>
    public interface ICueRepository : IRepository<Cue>
    {
        Task<List<Cue>> GetActiveCuesAsync(int pageNumber = 1, int pageSize = 20);
        Task<List<Cue>> GetCuesByUserAsync(int userId);
        Task<List<Cue>> SearchCuesAsync(string query, int pageNumber = 1, int pageSize = 20);
        Task<List<Cue>> GetCuesByBrandAsync(string brand);
        Task<List<Cue>> GetTopRatedCuesAsync(int count = 10);
        Task<List<Cue>> GetRecentCuesAsync(int count = 20);
        Task<int> GetTotalActiveCuesCountAsync();
    }

    /// <summary>
    /// Repository implementation for Cue operations
    /// </summary>
    public class CueRepository : Repository<Cue>, ICueRepository
    {
        private readonly CueFinderDbContext _context;
        private readonly ILogger<CueRepository> _logger;

        public CueRepository(CueFinderDbContext context, ILogger<CueRepository> logger) 
            : base(context, logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all active (not sold) cues with pagination
        /// </summary>
        public async Task<List<Cue>> GetActiveCuesAsync(int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var skipCount = (pageNumber - 1) * pageSize;
                return await _context.Cues
                    .Where(c => !c.IsSold)
                    .Include(c => c.User)
                    .Include(c => c.Images)
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip(skipCount)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active cues");
                throw;
            }
        }

        /// <summary>
        /// Get all cues by a specific user
        /// </summary>
        public async Task<List<Cue>> GetCuesByUserAsync(int userId)
        {
            try
            {
                return await _context.Cues
                    .Where(c => c.UserId == userId)
                    .Include(c => c.Images)
                    .Include(c => c.Ratings)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cues for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Search cues by query string
        /// </summary>
        public async Task<List<Cue>> SearchCuesAsync(string query, int pageNumber = 1, int pageSize = 20)
        {
            try
            {
                var skipCount = (pageNumber - 1) * pageSize;
                var searchLower = query.ToLower();

                return await _context.Cues
                    .Where(c => !c.IsSold && (
                        c.Title.ToLower().Contains(searchLower) ||
                        c.Brand.ToLower().Contains(searchLower) ||
                        c.Description.ToLower().Contains(searchLower) ||
                        c.Location.ToLower().Contains(searchLower)
                    ))
                    .Include(c => c.User)
                    .Include(c => c.Images)
                    .OrderByDescending(c => c.CreatedAt)
                    .Skip(skipCount)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching cues with query {Query}", query);
                throw;
            }
        }

        /// <summary>
        /// Get all cues by a specific brand
        /// </summary>
        public async Task<List<Cue>> GetCuesByBrandAsync(string brand)
        {
            try
            {
                return await _context.Cues
                    .Where(c => c.Brand.ToLower() == brand.ToLower() && !c.IsSold)
                    .Include(c => c.Images)
                    .Include(c => c.User)
                    .OrderByDescending(c => c.CreatedAt)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cues for brand {Brand}", brand);
                throw;
            }
        }

        /// <summary>
        /// Get top rated cues
        /// </summary>
        public async Task<List<Cue>> GetTopRatedCuesAsync(int count = 10)
        {
            try
            {
                return await _context.Cues
                    .Where(c => !c.IsSold && c.RatingCount > 0)
                    .Include(c => c.Images)
                    .Include(c => c.User)
                    .OrderByDescending(c => c.AverageRating)
                    .ThenByDescending(c => c.RatingCount)
                    .Take(count)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving top rated cues");
                throw;
            }
        }

        /// <summary>
        /// Get recently added cues
        /// </summary>
        public async Task<List<Cue>> GetRecentCuesAsync(int count = 20)
        {
            try
            {
                return await _context.Cues
                    .Where(c => !c.IsSold)
                    .Include(c => c.Images)
                    .Include(c => c.User)
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(count)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recent cues");
                throw;
            }
        }

        /// <summary>
        /// Get total count of active cues
        /// </summary>
        public async Task<int> GetTotalActiveCuesCountAsync()
        {
            try
            {
                return await _context.Cues
                    .Where(c => !c.IsSold)
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error counting active cues");
                throw;
            }
        }
    }
}
