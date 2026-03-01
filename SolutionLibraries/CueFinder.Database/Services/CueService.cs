using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Services
{
    /// <summary>
    /// Service interface for Cue operations
    /// </summary>
    public interface ICueService
    {
        Task<Cue?> GetCueWithDetailsAsync(int id);
        Task<List<Cue>> GetActiveCuesWithPaginationAsync(int pageNumber, int pageSize);
        Task<List<Cue>> GetUserCuesAsync(int userId);
        Task<List<Cue>> SearchCuesAsync(string query, int pageNumber, int pageSize);
        Task<Cue> CreateCueAsync(Cue cue);
        Task<Cue> UpdateCueAsync(Cue cue);
        Task<bool> DeleteCueAsync(int cueId);
        Task<bool> MarkAsSoldAsync(int cueId);
        Task<int> GetActiveCuesCountAsync();
    }

    /// <summary>
    /// Service implementation for Cue operations
    /// </summary>
    public class CueService : ICueService

    {
        /// <summary>
        /// Process old cue listings: prompt, hide, or delete based on inactivity (new business rules).
        /// </summary>
        public async Task ProcessOldListingsAsync()
        {
            var now = DateTime.UtcNow;
            var listings = await _context.Cues.ToListAsync();
            foreach (var listing in listings)
            {
                if (listing.IsSold)
                    continue;

                // If hidden for over 6 months, delete
                if (listing.IsHidden && listing.HiddenAt.HasValue && (now - listing.HiddenAt.Value).TotalDays > 180)
                {
                    _context.Cues.Remove(listing);
                    continue;
                }

                if (!listing.IsHidden)
                {
                    // First prompt: 2 months after creation
                    var firstPromptDue = (now - listing.CreatedAt).TotalDays >= 60 && !listing.LastPromptedAt.HasValue;
                    // Re-prompt: 2 months after last prompt if user pressed 'active'
                    var rePromptDue = listing.LastPromptedAt.HasValue && listing.LastUserResponseAt.HasValue && listing.LastUserResponseAt >= listing.LastPromptedAt && (now - listing.LastPromptedAt.Value).TotalDays >= 60;

                    if (firstPromptDue || rePromptDue)
                    {
                        // TODO: Send prompt to user (notification/email/etc.)
                        listing.LastPromptedAt = now;
                    }

                    // If last prompt was over 2 months ago and no user response since, hide
                    if (listing.LastPromptedAt.HasValue &&
                        (!listing.LastUserResponseAt.HasValue || listing.LastUserResponseAt < listing.LastPromptedAt) &&
                        (now - listing.LastPromptedAt.Value).TotalDays >= 60)
                    {
                        listing.IsHidden = true;
                        listing.HiddenAt = now;
                    }
                }
            }
            await _context.SaveChangesAsync();
        }

        private readonly ICueRepository _cueRepository;
        private readonly CueFinderDbContext _context;
        private readonly ILogger<CueService> _logger;

        public CueService(
            ICueRepository cueRepository,
            CueFinderDbContext context,
            ILogger<CueService> logger)
        {
            _cueRepository = cueRepository;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get cue with all related details
        /// </summary>
        public async Task<Cue?> GetCueWithDetailsAsync(int id)
        {
            try
            {
                return await _context.Cues
                    .Include(c => c.User)
                    .Include(c => c.Images)
                    .Include(c => c.Ratings)
                    .FirstOrDefaultAsync(c => c.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cue {CueId} with details", id);
                throw;
            }
        }

        /// <summary>
        /// Get active cues with pagination
        /// </summary>
        public async Task<List<Cue>> GetActiveCuesWithPaginationAsync(int pageNumber, int pageSize)
        {
            try
            {
                return await _cueRepository.GetActiveCuesAsync(pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active cues");
                throw;
            }
        }

        /// <summary>
        /// Get all cues posted by a user
        /// </summary>
        public async Task<List<Cue>> GetUserCuesAsync(int userId)
        {
            try
            {
                return await _cueRepository.GetCuesByUserAsync(userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cues for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Search cues by query
        /// </summary>
        public async Task<List<Cue>> SearchCuesAsync(string query, int pageNumber, int pageSize)
        {
            try
            {
                return await _cueRepository.SearchCuesAsync(query, pageNumber, pageSize);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching cues");
                throw;
            }
        }

        /// <summary>
        /// Create new cue
        /// </summary>
        public async Task<Cue> CreateCueAsync(Cue cue)
        {
            try
            {
                cue.CreatedAt = DateTime.UtcNow;
                cue.UpdatedAt = DateTime.UtcNow;
                return await _cueRepository.AddAsync(cue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating cue");
                throw;
            }
        }

        /// <summary>
        /// Update existing cue
        /// </summary>
        public async Task<Cue> UpdateCueAsync(Cue cue)
        {
            try
            {
                cue.UpdatedAt = DateTime.UtcNow;
                return await _cueRepository.UpdateAsync(cue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating cue");
                throw;
            }
        }

        /// <summary>
        /// Delete cue
        /// </summary>
        public async Task<bool> DeleteCueAsync(int cueId)
        {
            try
            {
                return await _cueRepository.DeleteAsync(cueId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting cue {CueId}", cueId);
                throw;
            }
        }

        /// <summary>
        /// Mark cue as sold
        /// </summary>
        public async Task<bool> MarkAsSoldAsync(int cueId)
        {
            try
            {
                var cue = await _cueRepository.GetByIdAsync(cueId);
                if (cue == null)
                    return false;

                cue.IsSold = true;
                cue.SoldDate = DateTime.UtcNow;
                await _cueRepository.UpdateAsync(cue);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking cue {CueId} as sold", cueId);
                throw;
            }
        }

        /// <summary>
        /// Get count of active cues
        /// </summary>
        public async Task<int> GetActiveCuesCountAsync()
        {
            try
            {
                return await _cueRepository.GetTotalActiveCuesCountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active cues count");
                throw;
            }
        }
    }
}
