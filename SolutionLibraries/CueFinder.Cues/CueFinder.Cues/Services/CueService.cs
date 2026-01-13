using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RatingModel = CueFinder.Database.Models.Rating;

namespace CueFinder.Cues.Services;

/// <summary>
/// Service implementation for cue management
/// </summary>
public class CueService : ICueService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<CueService> _logger;
    private readonly CueFinder.Extensions.Images.IImageService _imageService;

    public CueService(CueFinderDbContext context, ILogger<CueService> logger, CueFinder.Extensions.Images.IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }

    public async Task<List<CueResponseDto>> GetAllCuesAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest")
    {
        var query = _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
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
            .Where(c => c.UserId == userId && !c.IsSold)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cues.Select(MapToCueResponseDto).ToList();
    }

    public async Task<CueResponseDto> CreateCueAsync(CreateCueDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var cueType = string.IsNullOrWhiteSpace(dto.CueType)
            ? "playing"
            : dto.CueType.Trim().ToLowerInvariant();

        var cue = new Cue
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            CueType = cueType,
            ShaftMaterial = dto.Material ?? string.Empty,
            Weight = dto.Weight,
            Length = dto.Length,
            TipSize = dto.TipSize,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsSold = false,
            ViewCount = 0
        };

        _context.Cues.Add(cue);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} created by user {UserId}", cue.Id, userId);

        return MapToCueResponseDto(cue);
    }

    public async Task<CueResponseDto?> UpdateCueAsync(int cueId, UpdateCueDto dto, int userId)
    {
        var cue = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == cueId);

        if (cue == null)
            return null;

        // Check ownership
        if (cue.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own cues");

        // Update fields
        if (dto.Title != null) cue.Title = dto.Title;
        if (dto.Brand != null) cue.Brand = dto.Brand;
        if (dto.Description != null) cue.Description = dto.Description;
        if (dto.Price.HasValue) cue.Price = dto.Price.Value;
        if (dto.Condition != null) cue.Condition = dto.Condition;
        if (dto.CueType != null) cue.CueType = dto.CueType.Trim().ToLowerInvariant();
        if (dto.Material != null) cue.ShaftMaterial = dto.Material;
        if (dto.Weight.HasValue) cue.Weight = dto.Weight;
        if (dto.Length.HasValue) cue.Length = dto.Length;
        if (dto.TipSize.HasValue) cue.TipSize = dto.TipSize;
        if (dto.Location != null) cue.Location = dto.Location;
        if (dto.IsSold.HasValue) cue.IsSold = dto.IsSold.Value;
        
        cue.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} updated by user {UserId}", cueId, userId);

        return MapToCueResponseDto(cue);
    }

    public async Task<bool> DeleteCueAsync(int cueId, int userId, bool isAdmin = false)
    {
        var cue = await _context.Cues.FindAsync(cueId);

        if (cue == null)
            return false;

        // Check ownership or admin
        if (cue.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own cues");

        // Delete all associated images first
        await _imageService.DeleteCueImagesInternalAsync(cueId);

        // Soft delete by marking as sold
        cue.IsSold = true;
        cue.SoldDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} deleted by user {UserId}", cueId, userId);

        return true;
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

    private CueResponseDto MapToCueResponseDto(Cue cue)
    {
        return new CueResponseDto
        {
            Id = cue.Id,
            Title = cue.Title,
            Brand = cue.Brand,
            Description = cue.Description,
            Price = cue.Price,
            Condition = cue.Condition,
            CueType = cue.CueType,
            Material = cue.ShaftMaterial,
            Weight = cue.Weight,
            Length = cue.Length,
            TipSize = cue.TipSize,
            Location = cue.Location,
            IsSold = cue.IsSold,
            ViewCount = cue.ViewCount,
            CreatedAt = cue.CreatedAt,
            UpdatedAt = cue.UpdatedAt,
            SellerId = cue.UserId,
            SellerName = cue.User?.Name ?? string.Empty,
            SellerEmail = cue.User?.Email ?? string.Empty,
            SellerPhone = cue.User?.Phone ?? string.Empty,
            Images = cue.Images?.Select(i => new CueImageDto
            {
                Id = i.Id,
                CueId = i.CueId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<CueImageDto>(),
            AverageRating = (double)cue.AverageRating,
            RatingCount = cue.RatingCount
        };
    }
}
