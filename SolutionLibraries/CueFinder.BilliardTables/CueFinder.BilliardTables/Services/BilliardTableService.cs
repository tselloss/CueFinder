using CueFinder.BilliardTables.Interfaces;
using CueFinder.BilliardTables.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// Service implementation for billiard table management
/// </summary>
public class BilliardTableService : IBilliardTableService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<BilliardTableService> _logger;
    private readonly IImageService _imageService;

    public BilliardTableService(CueFinderDbContext context, ILogger<BilliardTableService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }

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
            .Where(t => !t.IsSold)
            .FirstOrDefaultAsync();

        if (table == null)
            return null;

        // Increment view count
        table.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<List<BilliardTableResponseDto>> GetUserBilliardTablesAsync(int userId)
    {
        var tables = await _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .Where(t => t.UserId == userId && !t.IsSold)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return tables.Select(MapToBilliardTableResponseDto).ToList();
    }

    public async Task<BilliardTableResponseDto> CreateBilliardTableAsync(CreateBilliardTableDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var table = new BilliardTable
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            TableSize = dto.TableSize,
            TableType = dto.TableType,
            PlayingSurface = dto.PlayingSurface,
            FeltType = dto.FeltType,
            FrameMaterial = dto.FrameMaterial,
            PocketType = dto.PocketType,
            Features = dto.Features,
            ManufactureYear = dto.ManufactureYear,
            Condition = dto.Condition,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsSold = false,
            ViewCount = 0
        };

        _context.BilliardTables.Add(table);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} created by user {UserId}", table.Id, userId);

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<BilliardTableResponseDto?> UpdateBilliardTableAsync(int tableId, UpdateBilliardTableDto dto, int userId)
    {
        var table = await _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tableId);

        if (table == null)
            return null;

        // Check ownership
        if (table.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own tables");

        // Update fields
        if (dto.Title != null) table.Title = dto.Title;
        if (dto.Brand != null) table.Brand = dto.Brand;
        if (dto.Description != null) table.Description = dto.Description;
        if (dto.Price.HasValue) table.Price = dto.Price.Value;
        if (dto.TableSize != null) table.TableSize = dto.TableSize;
        if (dto.TableType != null) table.TableType = dto.TableType;
        if (dto.PlayingSurface != null) table.PlayingSurface = dto.PlayingSurface;
        if (dto.FeltType != null) table.FeltType = dto.FeltType;
        if (dto.FrameMaterial != null) table.FrameMaterial = dto.FrameMaterial;
        if (dto.PocketType != null) table.PocketType = dto.PocketType;
        if (dto.Features != null) table.Features = dto.Features;
        if (dto.ManufactureYear.HasValue) table.ManufactureYear = dto.ManufactureYear;
        if (dto.Condition != null) table.Condition = dto.Condition;
        if (dto.Location != null) table.Location = dto.Location;
        if (dto.IsSold.HasValue) table.IsSold = dto.IsSold.Value;
        
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} updated by user {UserId}", tableId, userId);

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<bool> DeleteBilliardTableAsync(int tableId, int userId, bool isAdmin = false)
    {
        var table = await _context.BilliardTables.FindAsync(tableId);

        if (table == null)
            return false;

        // Check ownership or admin
        if (table.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own tables");

        // Delete all associated images first
        await _imageService.DeleteBilliardTableImagesInternalAsync(tableId);

        // Soft delete by marking as sold
        table.IsSold = true;
        table.SoldDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} deleted by user {UserId}", tableId, userId);

        return true;
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

    private BilliardTableResponseDto MapToBilliardTableResponseDto(BilliardTable table)
    {
        return new BilliardTableResponseDto
        {
            Id = table.Id,
            Title = table.Title,
            Brand = table.Brand,
            Description = table.Description,
            Price = table.Price,
            TableSize = table.TableSize,
            TableType = table.TableType,
            PlayingSurface = table.PlayingSurface,
            FeltType = table.FeltType,
            FrameMaterial = table.FrameMaterial,
            PocketType = table.PocketType,
            Features = table.Features,
            ManufactureYear = table.ManufactureYear,
            Condition = table.Condition,
            Location = table.Location,
            IsSold = table.IsSold,
            ViewCount = table.ViewCount,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt,
            SellerId = table.UserId,
            SellerName = table.User?.Name ?? string.Empty,
            SellerEmail = table.User?.Email ?? string.Empty,
            SellerPhone = table.User?.Phone,
            SellerHidePhone = table.User?.HidePhone ?? false,
            AverageRating = (double)table.AverageRating,
            RatingCount = table.RatingCount,
            Images = table.Images?.Select(i => new BilliardTableImageDto
            {
                Id = i.Id,
                BilliardTableId = i.BilliardTableId,
                ImageUrl = i.ImageUrl,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.CreatedAt
            }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<BilliardTableImageDto>()
        };
    }
}
