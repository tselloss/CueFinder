using CueFinder.BilliardTables.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// BilliardTableService partial: Read operations (queries)
/// - GetAllBilliardTablesAsync: Fetch all available billiard tables with filtering and sorting
/// - GetBilliardTableByIdAsync: Get a specific billiard table by ID with view count increment
/// - GetUserBilliardTablesAsync: Get all billiard tables for a specific user
/// - SearchBilliardTablesAsync: Search billiard tables by query string
/// </summary>
public partial class BilliardTableService
{
    public async Task<List<BilliardTableResponseDto>> GetAllBilliardTablesAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => !t.IsSold);

        // Apply filters
        if (!string.IsNullOrEmpty(condition))
            query = query.Where(t => t.Condition == condition);

        if (!string.IsNullOrEmpty(brand))
            query = query.Where(t => t.Brand.Contains(brand));

        if (minPrice.HasValue)
            query = query.Where(t => t.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(t => t.Price <= maxPrice.Value);

        // Apply sorting
        query = sortBy.ToLower() switch
        {
            "price_asc" => query.OrderBy(t => t.Price),
            "price_desc" => query.OrderByDescending(t => t.Price),
            "oldest" => query.OrderBy(t => t.CreatedAt),
            _ => query.OrderByDescending(t => t.CreatedAt) // newest (default)
        };

        var tables = await query.ToListAsync();

        return tables.Select(MapToBilliardTableResponseDto).ToList();
    }

    public async Task<BilliardTableResponseDto?> GetBilliardTableByIdAsync(int tableId)
    {
        var table = await _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => t.Id == tableId)
            .FirstOrDefaultAsync();

        if (table == null)
            return null;

        // Increment view count
        table.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<List<BilliardTableResponseDto>> GetUserBilliardTablesAsync(int userId, bool? hidden = null)
    {
        var query = _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => t.UserId == userId && !t.IsSold);

        if (hidden.HasValue)
        {
            if (hidden.Value)
                query = query.Where(t => t.IsHidden);
            else
                query = query.Where(t => !t.IsHidden);
        }

        var tables = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tables.Select(MapToBilliardTableResponseDto).ToList();
    }

    public async Task<List<BilliardTableResponseDto>> SearchBilliardTablesAsync(string query)
    {
        var searchTerm = query.ToLower();

        var tables = await _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => !t.IsSold && (
                t.Title.ToLower().Contains(searchTerm) ||
                t.Brand.ToLower().Contains(searchTerm) ||
                t.Description.ToLower().Contains(searchTerm) ||
                t.TableType.ToLower().Contains(searchTerm) ||
                (t.Location != null && t.Location.ToLower().Contains(searchTerm))
            ))
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tables.Select(MapToBilliardTableResponseDto).ToList();
    }

    public async Task<List<BilliardTableResponseDto>> GetFilteredBilliardTablesAsync(
        string? tableSize, string? tableType, string? condition,
        decimal? minPrice, decimal? maxPrice, int page, int pageSize)
    {
        var query = _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => !t.IsSold);

        if (!string.IsNullOrEmpty(tableSize))
            query = query.Where(t => t.TableSize == tableSize);
        if (!string.IsNullOrEmpty(tableType))
            query = query.Where(t => t.TableType == tableType);
        if (!string.IsNullOrEmpty(condition))
            query = query.Where(t => t.Condition == condition);
        if (minPrice.HasValue)
            query = query.Where(t => t.Price >= minPrice.Value);
        if (maxPrice.HasValue)
            query = query.Where(t => t.Price <= maxPrice.Value);

        var tables = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return tables.Select(MapToBilliardTableResponseDto).ToList();
    }

    public async Task<int> GetActiveCountAsync()
    {
        return await _context.BilliardTables.CountAsync(t => !t.IsSold);
    }
}
