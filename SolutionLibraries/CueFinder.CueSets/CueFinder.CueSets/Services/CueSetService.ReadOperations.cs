using CueFinder.CueSets.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.CueSets.Services;

public partial class CueSetService
{
    public async Task<List<CueSetResponseDto>> GetAllCueSetsAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .Where(s => !s.IsSold && !s.IsHidden);

        if (!string.IsNullOrEmpty(condition))
            query = query.Where(s => s.Condition == condition);

        if (!string.IsNullOrEmpty(brand))
            query = query.Where(s => s.Brand.Contains(brand));

        if (minPrice.HasValue)
            query = query.Where(s => s.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(s => s.Price <= maxPrice.Value);

        query = sortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(s => s.Price),
            "price_desc" => query.OrderByDescending(s => s.Price),
            "oldest" => query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var sets = await query.ToListAsync();
        return sets.Select(MapToCueSetResponseDto).ToList();
    }

    public async Task<CueSetResponseDto?> GetCueSetByIdAsync(int cueSetId)
    {
        var set = await _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == cueSetId);

        if (set == null)
            return null;

        set.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToCueSetResponseDto(set);
    }

    public async Task<List<CueSetResponseDto>> GetUserCueSetsAsync(int userId, bool? hidden = null)
    {
        var query = _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .Where(s => s.UserId == userId);

        if (hidden.HasValue)
        {
            query = hidden.Value
                ? query.Where(s => s.IsHidden)
                : query.Where(s => !s.IsHidden);
        }

        var sets = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
        return sets.Select(MapToCueSetResponseDto).ToList();
    }

    public async Task<List<CueSetResponseDto>> SearchCueSetsAsync(string query)
    {
        var term = query.ToLower();

        var sets = await _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .Where(s => !s.IsSold &&
                (s.Title.ToLower().Contains(term) ||
                 s.Brand.ToLower().Contains(term) ||
                 s.Description.ToLower().Contains(term)))
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return sets.Select(MapToCueSetResponseDto).ToList();
    }
}
