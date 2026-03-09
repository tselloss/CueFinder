using CueFinder.CueSets.Interfaces;
using CueFinder.CueSets.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Extensions.Moderation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Services;

public class ImageService : IImageService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<ImageService> _logger;
    private readonly string _uploadPath;
    private readonly IModerationService? _moderationService;

    public ImageService(CueFinderDbContext context, ILogger<ImageService> logger, IModerationService? moderationService = null)
    {
        _context = context;
        _logger = logger;
        _moderationService = moderationService;
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "sets");
        if (!Directory.Exists(_uploadPath))
            Directory.CreateDirectory(_uploadPath);
    }

    public async Task<List<CueSetImageDto>> UploadImagesAsync(int cueSetId, List<IFormFile> files, int userId)
    {
        var set = await _context.CueSets.FindAsync(cueSetId);
        if (set == null)
            throw new InvalidOperationException("Cue set not found");

        if (set.UserId != userId)
            throw new UnauthorizedAccessException("You can only upload images to your own listings");

        var uploaded = new List<CueSetImageDto>();
        var displayOrder = await _context.CueSetImages
            .Where(i => i.CueSetId == cueSetId)
            .MaxAsync(i => (int?)i.DisplayOrder) ?? 0;

        foreach (var file in files)
        {
            if (file == null || file.Length == 0) continue;

            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Skipping invalid image format: {FileName}", file.FileName);
                continue;
            }

            var fileName = $"{cueSetId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            displayOrder++;

            var image = new CueSetImage
            {
                CueSetId = cueSetId,
                ImageUrl = $"/uploads/sets/{fileName}",
                DisplayOrder = displayOrder,
                IsPrimary = uploaded.Count == 0,
                UploadedAt = DateTime.UtcNow
            };

            _context.CueSetImages.Add(image);
            await _context.SaveChangesAsync();

            if (_moderationService != null)
            {
                try
                {
                    var scanResult = await _moderationService.ScanImageAsync(filePath, userId, null, null);
                    if (scanResult.IsUnsafe)
                    {
                        await DeleteCueSetImagesInternalAsync(cueSetId);
                        _context.CueSets.Remove(set);
                        await _context.SaveChangesAsync();
                        throw new InvalidOperationException("Image violates content policy. Listing has been removed.");
                    }
                }
                catch (InvalidOperationException) { throw; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error scanning image for cue set {CueSetId}", cueSetId);
                }
            }

            uploaded.Add(new CueSetImageDto
            {
                Id = image.Id,
                ImageUrl = image.ImageUrl,
                DisplayOrder = image.DisplayOrder,
                IsPrimary = image.IsPrimary,
                UploadedAt = image.UploadedAt
            });
        }

        return uploaded;
    }

    public async Task<bool> DeleteImageAsync(int imageId, int userId)
    {
        var image = await _context.CueSetImages
            .Include(i => i.CueSet)
            .FirstOrDefaultAsync(i => i.Id == imageId);

        if (image == null) return false;

        if (image.CueSet?.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete images from your own listings");

        var fileName = Path.GetFileName(image.ImageUrl);
        var filePath = Path.Combine(_uploadPath, fileName);
        if (File.Exists(filePath))
        {
            try { File.Delete(filePath); }
            catch (Exception ex) { _logger.LogError(ex, "Failed to delete image file {FilePath}", filePath); }
        }

        _context.CueSetImages.Remove(image);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int imageId, int cueSetId, int userId)
    {
        var image = await _context.CueSetImages
            .Include(i => i.CueSet)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.CueSetId == cueSetId);

        if (image == null) return false;

        if (image.CueSet?.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify images from your own listings");

        var others = await _context.CueSetImages
            .Where(i => i.CueSetId == cueSetId && i.IsPrimary && i.Id != imageId)
            .ToListAsync();

        foreach (var img in others) img.IsPrimary = false;
        image.IsPrimary = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<CueSetImageDto>> GetCueSetImagesAsync(int cueSetId)
    {
        return await _context.CueSetImages
            .Where(i => i.CueSetId == cueSetId)
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => new CueSetImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            })
            .ToListAsync();
    }

    public async Task DeleteCueSetImagesInternalAsync(int cueSetId)
    {
        var images = await _context.CueSetImages
            .Where(i => i.CueSetId == cueSetId)
            .ToListAsync();

        foreach (var image in images)
        {
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(_uploadPath, fileName);
            if (File.Exists(filePath))
            {
                try { File.Delete(filePath); }
                catch (Exception ex) { _logger.LogError(ex, "Failed to delete image file {FilePath}", filePath); }
            }
        }

        _context.CueSetImages.RemoveRange(images);
        await _context.SaveChangesAsync();
    }
}
