using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Services;

/// <summary>
/// Service implementation for image management
/// </summary>
public class ImageService : IImageService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<ImageService> _logger;
    private readonly string _uploadPath;

    public ImageService(CueFinderDbContext context, ILogger<ImageService> logger)
    {
        _context = context;
        _logger = logger;
        
        // Set upload path (you can configure this via appsettings.json)
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "cues");
        
        // Ensure directory exists
        if (!Directory.Exists(_uploadPath))
            Directory.CreateDirectory(_uploadPath);
    }

    public async Task<CueImageDto> UploadImageAsync(int cueId, IFormFile image, int userId, string? altText = null, int displayOrder = 0, bool isPrimary = false)
    {
        // Verify cue exists and user owns it
        var cue = await _context.Cues.FindAsync(cueId);
        if (cue == null)
            throw new InvalidOperationException("Cue not found");

        if (cue.UserId != userId)
            throw new UnauthorizedAccessException("You can only upload images to your own cues");

        // Validate image
        if (image == null || image.Length == 0)
            throw new ArgumentException("Invalid image file");

        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var extension = Path.GetExtension(image.FileName).ToLowerInvariant();
        
        if (!allowedExtensions.Contains(extension))
            throw new ArgumentException("Invalid image format. Allowed: jpg, jpeg, png, gif, webp");

        // Generate unique filename
        var fileName = $"{cueId}_{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(_uploadPath, fileName);

        // Save file to disk
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await image.CopyToAsync(stream);
        }

        // If this is set as primary, unset other primary images
        if (isPrimary)
        {
            var existingPrimary = await _context.CueImages
                .Where(i => i.CueId == cueId && i.IsPrimary)
                .ToListAsync();
            
            foreach (var img in existingPrimary)
            {
                img.IsPrimary = false;
            }
        }

        // Create database record
        var cueImage = new CueImage
        {
            CueId = cueId,
            ImageUrl = $"/uploads/cues/{fileName}",
            AltText = altText,
            DisplayOrder = displayOrder,
            IsPrimary = isPrimary,
            UploadedAt = DateTime.UtcNow
        };

        _context.CueImages.Add(cueImage);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} uploaded for cue {CueId} by user {UserId}", cueImage.Id, cueId, userId);

        return new CueImageDto
        {
            Id = cueImage.Id,
            CueId = cueImage.CueId,
            ImageUrl = cueImage.ImageUrl,
            AltText = cueImage.AltText,
            DisplayOrder = cueImage.DisplayOrder,
            IsPrimary = cueImage.IsPrimary,
            UploadedAt = cueImage.UploadedAt
        };
    }

    public async Task<List<CueImageDto>> GetCueImagesAsync(int cueId)
    {
        var images = await _context.CueImages
            .Where(i => i.CueId == cueId)
            .OrderBy(i => i.DisplayOrder)
            .Select(i => new CueImageDto
            {
                Id = i.Id,
                CueId = i.CueId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            })
            .ToListAsync();

        return images;
    }

    public async Task<CueImageDto?> GetImageByIdAsync(int imageId)
    {
        var image = await _context.CueImages.FindAsync(imageId);
        
        if (image == null)
            return null;

        return new CueImageDto
        {
            Id = image.Id,
            CueId = image.CueId,
            ImageUrl = image.ImageUrl,
            AltText = image.AltText,
            DisplayOrder = image.DisplayOrder,
            IsPrimary = image.IsPrimary,
            UploadedAt = image.UploadedAt
        };
    }

    public async Task<bool> DeleteImageAsync(int imageId, int userId, bool isAdmin = false)
    {
        var image = await _context.CueImages
            .Include(i => i.Cue)
            .FirstOrDefaultAsync(i => i.Id == imageId);

        if (image == null)
            return false;

        // Check ownership or admin
        if (image.Cue?.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete images from your own cues");

        // Delete physical file
        var fileName = Path.GetFileName(image.ImageUrl);
        var filePath = Path.Combine(_uploadPath, fileName);
        
        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete physical file for image {ImageId}", imageId);
            }
        }

        // Delete database record
        _context.CueImages.Remove(image);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} deleted by user {UserId}", imageId, userId);

        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int imageId, int userId)
    {
        var image = await _context.CueImages
            .Include(i => i.Cue)
            .FirstOrDefaultAsync(i => i.Id == imageId);

        if (image == null)
            return false;

        // Check ownership
        if (image.Cue?.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify images on your own cues");

        // Unset other primary images for this cue
        var existingPrimary = await _context.CueImages
            .Where(i => i.CueId == image.CueId && i.IsPrimary && i.Id != imageId)
            .ToListAsync();

        foreach (var img in existingPrimary)
        {
            img.IsPrimary = false;
        }

        // Set this image as primary
        image.IsPrimary = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} set as primary by user {UserId}", imageId, userId);

        return true;
    }

    public async Task<bool> UpdateImageOrderAsync(int imageId, int newOrder, int userId)
    {
        var image = await _context.CueImages
            .Include(i => i.Cue)
            .FirstOrDefaultAsync(i => i.Id == imageId);

        if (image == null)
            return false;

        // Check ownership
        if (image.Cue?.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify images on your own cues");

        image.DisplayOrder = newOrder;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} order updated to {Order} by user {UserId}", imageId, newOrder, userId);

        return true;
    }
}
