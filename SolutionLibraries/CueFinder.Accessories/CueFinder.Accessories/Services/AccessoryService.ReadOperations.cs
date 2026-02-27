using CueFinder.Accessories.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Accessories.Services;

/// <summary>
/// AccessoryService partial: Read operations (queries)
/// - GetAllAccessoriesAsync: Fetch all available accessories with filtering and sorting
/// - GetAccessoryByIdAsync: Get a specific accessory by ID with view count increment
/// - GetUserAccessoriesAsync: Get all accessories for a specific user
/// - SearchAccessoriesAsync: Search accessories by query string
/// </summary>
public partial class AccessoryService
{
    public async Task<List<AccessoryResponseDto>> GetAllAccessoriesAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.Accessories
            .Include(a => a.Images)
            .Include(a => a.User)
            .Where(a => !a.IsSold);

        // Apply filters
        if (!string.IsNullOrEmpty(condition))
            query = query.Where(a => a.Condition == condition);

        if (!string.IsNullOrEmpty(brand))
            query = query.Where(a => a.Brand.Contains(brand));

        if (minPrice.HasValue)
            query = query.Where(a => a.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(a => a.Price <= maxPrice.Value);

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(a => a.Price),
            "price_desc" => query.OrderByDescending(a => a.Price),
            "oldest" => query.OrderBy(a => a.CreatedAt),
            _ => query.OrderByDescending(a => a.CreatedAt) // newest (default)
        };

        var accessories = await query.ToListAsync();

        return accessories.Select(MapToAccessoryResponseDto).ToList();
    }

    public async Task<AccessoryResponseDto?> GetAccessoryByIdAsync(int accessoryId)
    {
        var accessory = await _context.Accessories
            .Include(a => a.Images)
            .Include(a => a.User)
            .Where(a => a.Id == accessoryId)
            .Where(a => !a.IsSold)
            .FirstOrDefaultAsync();

        if (accessory == null)
            return null;

        // Increment view count
        accessory.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToAccessoryResponseDto(accessory);
    }

    public async Task<List<AccessoryResponseDto>> GetUserAccessoriesAsync(int userId, bool? hidden = null)
    {
        var query = _context.Accessories
            .Include(a => a.Images)
            .Include(a => a.User)
            .Where(a => a.UserId == userId && !a.IsSold);

        if (hidden.HasValue)
        {
            if (hidden.Value)
                query = query.Where(a => a.IsHidden);
            else
                query = query.Where(a => !a.IsHidden);
        }

        var accessories = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return accessories.Select(MapToAccessoryResponseDto).ToList();
    }

    public async Task<List<AccessoryResponseDto>> SearchAccessoriesAsync(string query)
    {
        var searchTerm = query.ToLower();

        var accessories = await _context.Accessories
            .Include(a => a.Images)
            .Include(a => a.User)
            .Where(a => !a.IsSold && (
                a.Title.ToLower().Contains(searchTerm) ||
                a.Brand.ToLower().Contains(searchTerm) ||
                a.Description.ToLower().Contains(searchTerm) ||
                a.AccessoryType.ToLower().Contains(searchTerm) ||
                (a.Location != null && a.Location.ToLower().Contains(searchTerm))
            ))
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return accessories.Select(MapToAccessoryResponseDto).ToList();
    }
}
