using CueFinder.BilliardTables.Interfaces;
using CueFinder.BilliardTables.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// Service implementation for billiard table image management
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

    public async Task<List<BilliardTableImageDto>> UploadBilliardTableImagesAsync(int tableId, List<IFormFile> files, int userId)
    {
        var table = await _context.BilliardTables.FirstOrDefaultAsync(t => t.Id == tableId);
        if (table == null)
            throw new InvalidOperationException("Billiard table not found");
        if (table.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify your own listings");

        var baseUploads = Path.Combine(_env.ContentRootPath, "uploads", "billiardtables", tableId.ToString());
        Directory.CreateDirectory(baseUploads);

        var results = new List<BilliardTableImageDto>();
        foreach (var file in files)
        {
            if (file == null || file.Length == 0) continue;

            var safeFileName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid():N}-{Path.GetFileName(file.FileName)}";
            var fullPath = Path.Combine(baseUploads, safeFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var image = new BilliardTableImage
            {
                BilliardTableId = tableId,
                ImageUrl = $"/uploads/billiardtables/{tableId}/{safeFileName}",
                IsPrimary = false,
                DisplayOrder = 0,
                CreatedAt = DateTime.UtcNow
            };

            _context.BilliardTableImages.Add(image);
            await _context.SaveChangesAsync();
            results.Add(MapToDto(image));
        }

        // Set first image as primary if none exists yet
        var hasPrimary = await _context.BilliardTableImages
            .AnyAsync(i => i.BilliardTableId == tableId && i.IsPrimary);
        if (!hasPrimary && results.Count > 0)
        {
            var first = await _context.BilliardTableImages.FirstOrDefaultAsync(i => i.Id == results[0].Id);
            if (first != null)
            {
                first.IsPrimary = true;
                await _context.SaveChangesAsync();
                results[0].IsPrimary = true;
            }
        }

        _logger.LogInformation("Uploaded {Count} images for billiard table {TableId}", results.Count, tableId);
        return results;
    }

    public async Task<List<BilliardTableImageDto>> GetBilliardTableImagesAsync(int tableId)
    {
        var images = await _context.BilliardTableImages
            .Where(i => i.BilliardTableId == tableId)
            .OrderBy(i => i.DisplayOrder).ThenBy(i => i.Id)
            .ToListAsync();

        return images.Select(MapToDto).ToList();
    }

    public async Task<bool> DeleteBilliardTableImageAsync(int tableId, int imageId, int userId)
    {
        // tableId=0 means look up image by imageId only (FE delete URL has no tableId)
        var image = tableId > 0
            ? await _context.BilliardTableImages.FirstOrDefaultAsync(i => i.Id == imageId && i.BilliardTableId == tableId)
            : await _context.BilliardTableImages.FirstOrDefaultAsync(i => i.Id == imageId);
        if (image == null) return false;

        var table = await _context.BilliardTables.FirstOrDefaultAsync(t => t.Id == image.BilliardTableId);
        if (table == null || table.UserId != userId) return false;

        TryDeleteFile(image.ImageUrl);
        _context.BilliardTableImages.Remove(image);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted image {ImageId} for billiard table {TableId}", imageId, tableId);
        return true;
    }

    public async Task<bool> DeleteBilliardTableImagesAsync(int tableId, int userId, bool isAdmin = false)
    {
        var table = await _context.BilliardTables.FirstOrDefaultAsync(t => t.Id == tableId);
        if (table == null) return false;
        if (table.UserId != userId && !isAdmin) return false;

        var images = await _context.BilliardTableImages.Where(i => i.BilliardTableId == tableId).ToListAsync();
        foreach (var img in images) TryDeleteFile(img.ImageUrl);
        _context.BilliardTableImages.RemoveRange(images);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted all images for billiard table {TableId}", tableId);
        return true;
    }

    public async Task<bool> DeleteBilliardTableImagesInternalAsync(int tableId)
    {
        var images = await _context.BilliardTableImages.Where(i => i.BilliardTableId == tableId).ToListAsync();
        foreach (var img in images) TryDeleteFile(img.ImageUrl);
        _context.BilliardTableImages.RemoveRange(images);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Internal deletion of images for billiard table {TableId}", tableId);
        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int tableId, int imageId, int userId)
    {
        var image = await _context.BilliardTableImages
            .FirstOrDefaultAsync(i => i.Id == imageId && i.BilliardTableId == tableId);
        if (image == null) return false;

        var table = await _context.BilliardTables.FirstOrDefaultAsync(t => t.Id == tableId);
        if (table == null || table.UserId != userId) return false;

        var others = await _context.BilliardTableImages
            .Where(i => i.BilliardTableId == tableId && i.Id != imageId && i.IsPrimary)
            .ToListAsync();
        foreach (var o in others) o.IsPrimary = false;
        image.IsPrimary = true;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Set image {ImageId} as primary for billiard table {TableId}", imageId, tableId);
        return true;
    }

    private static BilliardTableImageDto MapToDto(BilliardTableImage image) => new()
    {
        Id = image.Id,
        BilliardTableId = image.BilliardTableId,
        ImageUrl = image.ImageUrl,
        DisplayOrder = image.DisplayOrder,
        IsPrimary = image.IsPrimary,
        UploadedAt = image.CreatedAt
    };

    private void TryDeleteFile(string? relativeUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativeUrl)) return;
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
