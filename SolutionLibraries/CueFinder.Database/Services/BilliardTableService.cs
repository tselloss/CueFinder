using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Database.Services
{
    /// <summary>
    /// Service interface for BilliardTable operations
    /// </summary>
    public interface IBilliardTableService
    {
        Task<BilliardTable?> GetTableWithDetailsAsync(int id);
        Task<List<BilliardTable>> GetActiveTablesWithPaginationAsync(int pageNumber, int pageSize);
        Task<List<BilliardTable>> GetUserTablesAsync(int userId);
        Task<List<BilliardTable>> SearchTablesAsync(string query, int pageNumber, int pageSize);
        Task<List<BilliardTable>> GetTablesWithFiltersAsync(string? tableSize = null, string? tableType = null, decimal? minPrice = null, decimal? maxPrice = null, string? condition = null, int pageNumber = 1, int pageSize = 20);
        Task<BilliardTable> CreateTableAsync(BilliardTable table);
        Task<BilliardTable> UpdateTableAsync(BilliardTable table);
        Task<bool> DeleteTableAsync(int tableId);
        Task<bool> MarkAsSoldAsync(int tableId);
        Task<int> GetActiveTablesCountAsync();
        Task<bool> AddImageAsync(int tableId, BilliardTableImage image);
        Task<bool> RemoveImageAsync(int imageId);
        Task<bool> SetPrimaryImageAsync(int tableId, int imageId);
    }

    /// <summary>
    /// Service implementation for BilliardTable operations
    /// </summary>
    public class BilliardTableService : IBilliardTableService

            /// <summary>
            /// Process old listings: prompt, hide, or delete based on inactivity (new business rules).
            /// </summary>
            public async Task ProcessOldListingsAsync()
            {
                var now = DateTime.UtcNow;
                var listings = await _context.BilliardTables.ToListAsync();
                foreach (var listing in listings)
                {
                    if (listing.IsSold)
                        continue;

                    // If hidden for over 6 months, delete
                    if (listing.IsHidden && listing.HiddenAt.HasValue && (now - listing.HiddenAt.Value).TotalDays > 180)
                    {
                        _context.BilliardTables.Remove(listing);
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
    {
        private readonly CueFinderDbContext _context;
        private readonly ILogger<BilliardTableService> _logger;

        public BilliardTableService(
            CueFinderDbContext context,
            ILogger<BilliardTableService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get table with all related details
        /// </summary>
        public async Task<BilliardTable?> GetTableWithDetailsAsync(int id)
        {
            try
            {
                return await _context.BilliardTables
                    .Include(t => t.User)
                    .Include(t => t.Images)
                    .Include(t => t.Ratings)
                    .FirstOrDefaultAsync(t => t.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving billiard table {TableId} with details", id);
                throw;
            }
        }

        /// <summary>
        /// Get active tables with pagination
        /// </summary>
        public async Task<List<BilliardTable>> GetActiveTablesWithPaginationAsync(int pageNumber, int pageSize)
        {
            try
            {
                var skip = (pageNumber - 1) * pageSize;

                return await _context.BilliardTables
                    .Include(t => t.User)
                    .Include(t => t.Images)
                    .Include(t => t.Ratings)
                    .Where(t => !t.IsSold && t.ModerationStatus == "approved")
                    .OrderByDescending(t => t.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving active billiard tables");
                throw;
            }
        }

        /// <summary>
        /// Get all tables posted by a specific user
        /// </summary>
        public async Task<List<BilliardTable>> GetUserTablesAsync(int userId, bool? hidden = null)
        {
            try
            {
                var query = _context.BilliardTables
                    .Include(t => t.Images)
                    .Where(t => t.UserId == userId);

                if (hidden.HasValue)
                {
                    if (hidden.Value)
                        query = query.Where(t => t.IsHidden);
                    else
                        query = query.Where(t => !t.IsHidden);
                }

                return await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving tables for user {UserId}", userId);
                throw;
            }
        }

        /// <summary>
        /// Search tables by query string
        /// </summary>
        public async Task<List<BilliardTable>> SearchTablesAsync(string query, int pageNumber, int pageSize)
        {
            try
            {
                var skip = (pageNumber - 1) * pageSize;
                var searchTerm = query.ToLower();

                return await _context.BilliardTables
                    .Include(t => t.User)
                    .Include(t => t.Images)
                    .Where(t => !t.IsSold &&
                        (t.Title.ToLower().Contains(searchTerm) ||
                         t.Brand.ToLower().Contains(searchTerm) ||
                         t.Description.ToLower().Contains(searchTerm) ||
                         t.TableSize.ToLower().Contains(searchTerm) ||
                         t.TableType.ToLower().Contains(searchTerm)))
                    .OrderByDescending(t => t.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching billiard tables with query {Query}", query);
                throw;
            }
        }

        /// <summary>
        /// Get tables with advanced filtering options
        /// </summary>
        public async Task<List<BilliardTable>> GetTablesWithFiltersAsync(
            string? tableSize = null,
            string? tableType = null,
            decimal? minPrice = null,
            decimal? maxPrice = null,
            string? condition = null,
            int pageNumber = 1,
            int pageSize = 20)
        {
            try
            {
                var skip = (pageNumber - 1) * pageSize;

                var query = _context.BilliardTables
                    .Include(t => t.User)
                    .Include(t => t.Images)
                    .Where(t => !t.IsSold && t.ModerationStatus == "approved");

                if (!string.IsNullOrEmpty(tableSize))
                    query = query.Where(t => t.TableSize == tableSize);

                if (!string.IsNullOrEmpty(tableType))
                    query = query.Where(t => t.TableType == tableType);

                if (minPrice.HasValue)
                    query = query.Where(t => t.Price >= minPrice.Value);

                if (maxPrice.HasValue)
                    query = query.Where(t => t.Price <= maxPrice.Value);

                if (!string.IsNullOrEmpty(condition))
                    query = query.Where(t => t.Condition == condition);

                return await query
                    .OrderByDescending(t => t.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered billiard tables");
                throw;
            }
        }

        /// <summary>
        /// Create a new billiard table listing
        /// </summary>
        public async Task<BilliardTable> CreateTableAsync(BilliardTable table)
        {
            try
            {
                table.CreatedAt = DateTime.UtcNow;
                table.UpdatedAt = DateTime.UtcNow;

                _context.BilliardTables.Add(table);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created new billiard table {TableId}", table.Id);
                return table;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating billiard table");
                throw;
            }
        }

        /// <summary>
        /// Update an existing billiard table
        /// </summary>
        public async Task<BilliardTable> UpdateTableAsync(BilliardTable table)
        {
            try
            {
                table.UpdatedAt = DateTime.UtcNow;

                _context.BilliardTables.Update(table);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated billiard table {TableId}", table.Id);
                return table;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating billiard table {TableId}", table.Id);
                throw;
            }
        }

        /// <summary>
        /// Delete a billiard table listing
        /// </summary>
        public async Task<bool> DeleteTableAsync(int tableId)
        {
            try
            {
                var table = await _context.BilliardTables.FindAsync(tableId);
                if (table == null)
                    return false;

                _context.BilliardTables.Remove(table);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted billiard table {TableId}", tableId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting billiard table {TableId}", tableId);
                throw;
            }
        }

        /// <summary>
        /// Mark a billiard table as sold
        /// </summary>
        public async Task<bool> MarkAsSoldAsync(int tableId)
        {
            try
            {
                var table = await _context.BilliardTables.FindAsync(tableId);
                if (table == null)
                    return false;

                table.IsSold = true;
                table.SoldDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Marked billiard table {TableId} as sold", tableId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking billiard table {TableId} as sold", tableId);
                throw;
            }
        }

        /// <summary>
        /// Get count of active billiard tables
        /// </summary>
        public async Task<int> GetActiveTablesCountAsync()
        {
            try
            {
                return await _context.BilliardTables
                    .Where(t => !t.IsSold && t.ModerationStatus == "approved")
                    .CountAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active billiard tables count");
                throw;
            }
        }

        /// <summary>
        /// Add an image to a billiard table
        /// </summary>
        public async Task<bool> AddImageAsync(int tableId, BilliardTableImage image)
        {
            try
            {
                var table = await _context.BilliardTables.FindAsync(tableId);
                if (table == null)
                    return false;

                image.BilliardTableId = tableId;
                image.CreatedAt = DateTime.UtcNow;

                if (!image.IsPrimary)
                {
                    image.IsPrimary = (await _context.BilliardTableImages
                        .CountAsync(i => i.BilliardTableId == tableId)) == 0;
                }

                _context.BilliardTableImages.Add(image);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding image to billiard table {TableId}", tableId);
                throw;
            }
        }

        /// <summary>
        /// Remove an image from a billiard table
        /// </summary>
        public async Task<bool> RemoveImageAsync(int imageId)
        {
            try
            {
                var image = await _context.BilliardTableImages.FindAsync(imageId);
                if (image == null)
                    return false;

                _context.BilliardTableImages.Remove(image);
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing image {ImageId}", imageId);
                throw;
            }
        }

        /// <summary>
        /// Set primary image for a billiard table
        /// </summary>
        public async Task<bool> SetPrimaryImageAsync(int tableId, int imageId)
        {
            try
            {
                // Clear primary status from all images of this table
                var allImages = await _context.BilliardTableImages
                    .Where(i => i.BilliardTableId == tableId)
                    .ToListAsync();

                foreach (var img in allImages)
                {
                    img.IsPrimary = false;
                }

                // Set the selected image as primary
                var selectedImage = allImages.FirstOrDefault(i => i.Id == imageId);
                if (selectedImage == null)
                    return false;

                selectedImage.IsPrimary = true;
                await _context.SaveChangesAsync();

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image {ImageId} for table {TableId}", imageId, tableId);
                throw;
            }
        }
    }
}
