using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Services;

/// <summary>
/// Service implementation for accessory image management
/// </summary>
public class ImageService : IImageService
{
    private readonly ILogger<ImageService> _logger;
    private readonly CueFinderDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ImageService(ILogger<ImageService> logger, CueFinderDbContext context, IWebHostEnvironment env)
    {
        _logger = logger;
        _context = context;
        _env = env;
    }

    public async Task<AccessoryImageDto> UploadAccessoryImageAsync(int accessoryId, IFormFile file, int userId, string? altText = null, int displayOrder = 0, bool isPrimary = false)
    {
        // Validate accessory ownership
        var accessory = await _context.Accessories.FirstOrDefaultAsync(a => a.Id == accessoryId);
        if (accessory == null)
            throw new InvalidOperationException("Accessory not found");
        if (accessory.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify your own accessories");

        if (file == null || file.Length == 0)
            throw new InvalidOperationException("No file provided");

        // Prepare storage path
        var baseUploads = Path.Combine(_env.ContentRootPath, "uploads", "accessories", accessoryId.ToString());
        Directory.CreateDirectory(baseUploads);

        var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{Path.GetFileName(file.FileName)}";
        var fullPath = Path.Combine(baseUploads, safeFileName);

        using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var relativeUrl = $"/uploads/accessories/{accessoryId}/{safeFileName}";

        if (isPrimary)
        {
            var others = await _context.AccessoryImages.Where(i => i.AccessoryId == accessoryId && i.IsPrimary).ToListAsync();
            foreach (var o in others) o.IsPrimary = false;
        }

        var image = new AccessoryImage
        {
            AccessoryId = accessoryId,
            ImageUrl = relativeUrl,
            AltText = altText,
            DisplayOrder = displayOrder,
            IsPrimary = isPrimary,
            UploadedAt = DateTime.UtcNow
        };

        _context.AccessoryImages.Add(image);
        await _context.SaveChangesAsync();

        return new AccessoryImageDto
        {
            Id = image.Id,
            AccessoryId = accessoryId,
            ImageUrl = image.ImageUrl,
            AltText = image.AltText,
            DisplayOrder = image.DisplayOrder,
            IsPrimary = image.IsPrimary,
            UploadedAt = image.UploadedAt
        };
    }

    public async Task<List<AccessoryImageDto>> GetAccessoryImagesAsync(int accessoryId)
    {
        var images = await _context.AccessoryImages
            .Where(i => i.AccessoryId == accessoryId)
            .OrderBy(i => i.DisplayOrder).ThenBy(i => i.Id)
            .ToListAsync();

        return images.Select(i => new AccessoryImageDto
        {
            Id = i.Id,
            AccessoryId = i.AccessoryId,
            ImageUrl = i.ImageUrl,
            AltText = i.AltText,
            DisplayOrder = i.DisplayOrder,
            IsPrimary = i.IsPrimary,
            UploadedAt = i.UploadedAt
        }).ToList();
    }

    public async Task<AccessoryImageDto?> GetAccessoryImageAsync(int imageId)
    {
        var i = await _context.AccessoryImages.FirstOrDefaultAsync(x => x.Id == imageId);
        if (i == null) return null;
        return new AccessoryImageDto
        {
            Id = i.Id,
            AccessoryId = i.AccessoryId,
            ImageUrl = i.ImageUrl,
            AltText = i.AltText,
            DisplayOrder = i.DisplayOrder,
            IsPrimary = i.IsPrimary,
            UploadedAt = i.UploadedAt
        };
    }

    public async Task<bool> DeleteAccessoryImagesAsync(int accessoryId, int userId, bool isAdmin = false)
    {
        var accessory = await _context.Accessories.FirstOrDefaultAsync(a => a.Id == accessoryId);
        if (accessory == null) return false;
        if (accessory.UserId != userId && !isAdmin) return false;

        var images = await _context.AccessoryImages.Where(i => i.AccessoryId == accessoryId).ToListAsync();
        foreach (var img in images)
        {
            TryDeleteFile(img.ImageUrl);
        }
        _context.AccessoryImages.RemoveRange(images);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted all images for accessory {AccessoryId}", accessoryId);
        return true;
    }

    public async Task<bool> DeleteAccessoryImagesInternalAsync(int accessoryId)
    {
        var images = await _context.AccessoryImages.Where(i => i.AccessoryId == accessoryId).ToListAsync();
        foreach (var img in images)
        {
            TryDeleteFile(img.ImageUrl);
        }
        _context.AccessoryImages.RemoveRange(images);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Internal deletion of images for accessory {AccessoryId}", accessoryId);
        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int accessoryId, int imageId, int userId)
    {
        var image = await _context.AccessoryImages.FirstOrDefaultAsync(i => i.Id == imageId && i.AccessoryId == accessoryId);
        if (image == null) return false;

        var accessory = await _context.Accessories.FirstOrDefaultAsync(a => a.Id == accessoryId);
        if (accessory == null) return false;
        if (accessory.UserId != userId) return false;

        var others = await _context.AccessoryImages.Where(i => i.AccessoryId == accessoryId && i.Id != imageId && i.IsPrimary).ToListAsync();
        foreach (var o in others) o.IsPrimary = false;
        image.IsPrimary = true;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Set image {ImageId} as primary for accessory {AccessoryId}", imageId, accessoryId);
        return true;
    }

    public async Task<bool> DeleteAccessoryImageAsync(int accessoryId, int imageId, int userId)
    {
        var image = await _context.AccessoryImages.FirstOrDefaultAsync(i => i.Id == imageId && i.AccessoryId == accessoryId);
        if (image == null) return false;

        var accessory = await _context.Accessories.FirstOrDefaultAsync(a => a.Id == accessoryId);
        if (accessory == null) return false;
        if (accessory.UserId != userId) return false;

        TryDeleteFile(image.ImageUrl);
        _context.AccessoryImages.Remove(image);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted image {ImageId} for accessory {AccessoryId}", imageId, accessoryId);
        return true;
    }

    private void TryDeleteFile(string? relativeUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativeUrl)) return;
            // relativeUrl like /uploads/accessories/{id}/{file}
            if (!relativeUrl.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)) return;
            var local = relativeUrl.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
            var fullPath = Path.Combine(_env.ContentRootPath, local);
            if (File.Exists(fullPath)) File.Delete(fullPath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to delete file for url {Url}", relativeUrl);
        }
    }
}
