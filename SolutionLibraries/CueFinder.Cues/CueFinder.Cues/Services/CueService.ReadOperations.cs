using CueFinder.Cues.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Cues.Services;

/// <summary>
/// CueService partial: Read operations (queries)
/// - GetAllCuesAsync: Fetch all available cues with filtering and sorting
/// - GetCueByIdAsync: Get a specific cue by ID with view count increment
/// - GetUserCuesAsync: Get all cues for a specific user
/// - SearchCuesAsync: Search cues by query string
/// </summary>
public partial class CueService
{
    public async Task<List<CueResponseDto>> GetAllCuesAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .AsSplitQuery()
            .Where(c => !c.IsSold);

        // Apply filters
        if (!string.IsNullOrEmpty(condition))
            query = query.Where(c => c.Condition == condition);

        if (!string.IsNullOrEmpty(brand))
            query = query.Where(c => c.Brand.Contains(brand));

        if (minPrice.HasValue)
            query = query.Where(c => c.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(c => c.Price <= maxPrice.Value);

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(c => c.Price),
            "price_desc" => query.OrderByDescending(c => c.Price),
            "oldest" => query.OrderBy(c => c.CreatedAt),
            _ => query.OrderByDescending(c => c.CreatedAt) // newest (default)
        };

        var cues = await query.ToListAsync();

        return cues.Select(MapToCueResponseDto).ToList();
    }

    public async Task<CueResponseDto?> GetCueByIdAsync(int cueId)
    {
        // Query cues excluding soft-deleted ones (IsSold = true)
        var cue = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .AsSplitQuery()
            .Where(c => c.Id == cueId)
            .Where(c => !c.IsSold)
            .FirstOrDefaultAsync();

        if (cue == null)
            return null;

        // Increment view count
        cue.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToCueResponseDto(cue);
    }

    public async Task<List<CueResponseDto>> GetUserCuesAsync(int userId)
    {
        var cues = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .AsSplitQuery()
            .Where(c => c.UserId == userId && !c.IsSold)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cues.Select(MapToCueResponseDto).ToList();
    }

    public async Task<List<CueResponseDto>> SearchCuesAsync(string query)
    {
        var searchTerm = query.ToLower();

        var cues = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .Where(c => !c.IsSold && (
                c.Title.ToLower().Contains(searchTerm) ||
                c.Brand.ToLower().Contains(searchTerm) ||
                c.Description.ToLower().Contains(searchTerm) ||
                (c.Location != null && c.Location.ToLower().Contains(searchTerm))
            ))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cues.Select(MapToCueResponseDto).ToList();
    }
}
