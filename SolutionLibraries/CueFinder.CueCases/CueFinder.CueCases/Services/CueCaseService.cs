using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Services;

/// <summary>
/// Service implementation for cue case management
/// </summary>
public class CueCaseService : ICueCaseService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<CueCaseService> _logger;
    private readonly IImageService _imageService;

    public CueCaseService(CueFinderDbContext context, ILogger<CueCaseService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }

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

    public async Task<List<CueCaseResponseDto>> GetUserCueCasesAsync(int userId)
    {
        var cueCases = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .Where(c => c.UserId == userId && !c.IsSold)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return cueCases.Select(MapToCueCaseResponseDto).ToList();
    }

    public async Task<CueCaseResponseDto> CreateCueCaseAsync(CreateCueCaseDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var cueCase = new CueCase
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            CaseCapacity = dto.CaseCapacity,
            CaseOpening = dto.CaseOpening,
            CaseType = dto.CaseType,
            Color = dto.Color,
            CaseMaterial = dto.CaseMaterial,
            OuterDimensions = dto.OuterDimensions,
            PocketSpace = dto.PocketSpace,
            HandleExtensionSpace = dto.HandleExtensionSpace,
            CaseWeight = dto.CaseWeight,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CueCases.Add(cueCase);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new cue case listing {CueCaseId} by user {UserId}", cueCase.Id, userId);

        return MapToCueCaseResponseDto(cueCase);
    }

    public async Task<CueCaseResponseDto?> UpdateCueCaseAsync(int cueCaseId, UpdateCueCaseDto dto, int userId)
    {
        var cueCase = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == cueCaseId);

        if (cueCase == null)
            return null;

        // Verify ownership
        if (cueCase.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own listings");

        // Update fields if provided
        if (!string.IsNullOrEmpty(dto.Title))
            cueCase.Title = dto.Title;

        if (!string.IsNullOrEmpty(dto.Brand))
            cueCase.Brand = dto.Brand;

        if (!string.IsNullOrEmpty(dto.Description))
            cueCase.Description = dto.Description;

        if (dto.Price.HasValue)
            cueCase.Price = dto.Price.Value;

        if (!string.IsNullOrEmpty(dto.Condition))
            cueCase.Condition = dto.Condition;

        if (!string.IsNullOrEmpty(dto.CaseCapacity))
            cueCase.CaseCapacity = dto.CaseCapacity;

        if (!string.IsNullOrEmpty(dto.CaseOpening))
            cueCase.CaseOpening = dto.CaseOpening;

        if (!string.IsNullOrEmpty(dto.CaseType))
            cueCase.CaseType = dto.CaseType;

        if (dto.Color != null)
            cueCase.Color = dto.Color;

        if (dto.CaseMaterial != null)
            cueCase.CaseMaterial = dto.CaseMaterial;

        if (dto.OuterDimensions != null)
            cueCase.OuterDimensions = dto.OuterDimensions;

        if (dto.PocketSpace != null)
            cueCase.PocketSpace = dto.PocketSpace;

        if (dto.HandleExtensionSpace != null)
            cueCase.HandleExtensionSpace = dto.HandleExtensionSpace;

        if (dto.CaseWeight != null)
            cueCase.CaseWeight = dto.CaseWeight;

        if (dto.Location != null)
            cueCase.Location = dto.Location;

        if (dto.IsSold.HasValue)
        {
            cueCase.IsSold = dto.IsSold.Value;
            if (dto.IsSold.Value && !cueCase.SoldDate.HasValue)
                cueCase.SoldDate = DateTime.UtcNow;
        }

        cueCase.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated cue case listing {CueCaseId}", cueCaseId);

        return MapToCueCaseResponseDto(cueCase);
    }

    public async Task<bool> DeleteCueCaseAsync(int cueCaseId, int userId, bool isAdmin = false)
    {
        var cueCase = await _context.CueCases
            .Include(c => c.Images)
            .FirstOrDefaultAsync(c => c.Id == cueCaseId);

        if (cueCase == null)
            return false;

        // Verify ownership or admin
        if (cueCase.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own listings");

        // Delete all associated images first
        await _imageService.DeleteCueCaseImagesInternalAsync(cueCaseId);

        _context.CueCases.Remove(cueCase);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted cue case listing {CueCaseId} by user {UserId}", cueCaseId, userId);

        return true;
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

    #region Mapping Helpers

    private static CueCaseResponseDto MapToCueCaseResponseDto(CueCase cueCase)
    {
    return new CueCaseResponseDto
        {
            Id = cueCase.Id,
            Title = cueCase.Title,
            Brand = cueCase.Brand,
            Description = cueCase.Description,
            Price = cueCase.Price,
            Condition = cueCase.Condition,
            CaseCapacity = cueCase.CaseCapacity,
            CaseOpening = cueCase.CaseOpening,
            CaseType = cueCase.CaseType,
            Color = cueCase.Color,
            CaseMaterial = cueCase.CaseMaterial,
            OuterDimensions = cueCase.OuterDimensions,
            PocketSpace = cueCase.PocketSpace,
            HandleExtensionSpace = cueCase.HandleExtensionSpace,
            CaseWeight = cueCase.CaseWeight,
            Location = cueCase.Location,
            IsSold = cueCase.IsSold,
            SoldDate = cueCase.SoldDate,
            UserId = cueCase.UserId,
            UserName = cueCase.User?.Username,
            SellerId = cueCase.UserId,
            SellerName = cueCase.User?.Name ?? cueCase.User?.Username,
            SellerEmail = cueCase.User?.Email,
            SellerPhone = cueCase.User?.Phone,
            SellerHidePhone = cueCase.User?.HidePhone ?? false,
            ViewCount = cueCase.ViewCount,
            AverageRating = cueCase.AverageRating,
            RatingCount = cueCase.RatingCount,
            CreatedAt = cueCase.CreatedAt,
            UpdatedAt = cueCase.UpdatedAt,
            Images = cueCase.Images?.Select(img => new CueCaseImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                DisplayOrder = img.DisplayOrder,
                IsPrimary = img.IsPrimary,
                UploadedAt = img.UploadedAt
            }).OrderBy(img => img.DisplayOrder).ToList() ?? new List<CueCaseImageDto>()
        };
    }

    #endregion
}
