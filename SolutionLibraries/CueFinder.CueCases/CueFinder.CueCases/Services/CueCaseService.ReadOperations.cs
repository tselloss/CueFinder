using CueFinder.CueCases.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.CueCases.Services;

/// <summary>
/// CueCaseService partial: Read operations (queries)
/// - GetAllCueCasesAsync: Fetch all available cue cases with filtering and sorting
/// - GetCueCaseByIdAsync: Get a specific cue case by ID with view count increment
/// - GetUserCueCasesAsync: Get all cue cases for a specific user
/// - SearchCueCasesAsync: Search cue cases by query string
/// </summary>
public partial class CueCaseService
{
    public async Task<List<CueCaseResponseDto>> GetAllCueCasesAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
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

        var cueCases = await query.ToListAsync();

        return cueCases.Select(MapToCueCaseResponseDto).ToList();
    }

    public async Task<CueCaseResponseDto?> GetCueCaseByIdAsync(int cueCaseId)
    {
        var cueCase = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == cueCaseId && !c.IsSold);

        if (cueCase == null)
            return null;

        // Increment view count
        cueCase.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToCueCaseResponseDto(cueCase);
    }

    public async Task<List<CueCaseResponseDto>> GetUserCueCasesAsync(int userId, bool? hidden = null)
    {
        var query = _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .Where(c => c.UserId == userId && !c.IsSold);

        if (hidden.HasValue)
        {
            if (hidden.Value)
                query = query.Where(c => c.IsHidden);
            else
                query = query.Where(c => !c.IsHidden);
        }

        var cueCases = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
        return cueCases.Select(MapToCueCaseResponseDto).ToList();
    }

    public async Task<List<CueCaseResponseDto>> SearchCueCasesAsync(string query)
    {
        var searchTerm = query.ToLower();

        var cueCases = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .Where(c => !c.IsSold &&
                (c.Title.ToLower().Contains(searchTerm) ||
                 c.Brand.ToLower().Contains(searchTerm) ||
                 c.Description.ToLower().Contains(searchTerm) ||
                 (c.CaseType != null && c.CaseType.ToLower().Contains(searchTerm))))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cueCases.Select(MapToCueCaseResponseDto).ToList();
    }
}
