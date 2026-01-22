using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Extensions.Moderation;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Services;

/// <summary>
/// Service implementation for cue case image management
/// </summary>
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
        
        // Set upload path
        // Use shared uploads volume (works in Docker and locally)
        _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "cases");
        
        // Ensure directory exists
        if (!Directory.Exists(_uploadPath))
            Directory.CreateDirectory(_uploadPath);
    }

    public async Task<List<CueCaseImageDto>> UploadImagesAsync(int cueCaseId, List<IFormFile> files, int userId)
    {
        // Verify cue case exists and user owns it
        var cueCase = await _context.CueCases.FindAsync(cueCaseId);
        if (cueCase == null)
            throw new InvalidOperationException("Cue case not found");

        if (cueCase.UserId != userId)
            throw new UnauthorizedAccessException("You can only upload images to your own listings");

        var uploadedImages = new List<CueCaseImageDto>();
        var displayOrder = await _context.CueCaseImages
            .Where(i => i.CueCaseId == cueCaseId)
            .MaxAsync(i => (int?)i.DisplayOrder) ?? 0;

        foreach (var file in files)
        {
            if (file == null || file.Length == 0)
                continue;

            // Validate image
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            
            if (!allowedExtensions.Contains(extension))
            {
                _logger.LogWarning("Skipping invalid image format: {FileName}", file.FileName);
                continue;
            }

            // Generate unique filename
            var fileName = $"{cueCaseId}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(_uploadPath, fileName);

            // Save file to disk
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            displayOrder++;

            // Create database record
            var caseImage = new CueCaseImage
            {
                CueCaseId = cueCaseId,
                ImageUrl = $"/uploads/cases/{fileName}",
                DisplayOrder = displayOrder,
                IsPrimary = uploadedImages.Count == 0, // First image is primary
                UploadedAt = DateTime.UtcNow
            };

            _context.CueCaseImages.Add(caseImage);
            await _context.SaveChangesAsync();

            // Scan image for inappropriate content if moderation service is available
            if (_moderationService != null)
            {
                try
                {
                    _logger.LogInformation(
                        "Scanning uploaded image for cue case {CueCaseId}, User {UserId}, FilePath: {FilePath}",
                        cueCaseId, userId, filePath);

                    var scanResult = await _moderationService.ScanImageAsync(filePath, userId, null, cueCaseId);
                    
                    if (scanResult.IsUnsafe)
                    {
                        _logger.LogWarning(
                            "Image flagged for cue case {CueCaseId}: {Reason}, Confidence: {Score}",
                            cueCaseId, scanResult.FlagReason, scanResult.ConfidenceScore);

                        // Delete the cue case and all its images
                        await DeleteCueCaseIfFlaggedAsync(cueCaseId, userId);

                        throw new InvalidOperationException("Image violates content policy. Listing has been removed.");
                    }
                }
                catch (InvalidOperationException)
                {
                    throw; // Re-throw to caller
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error scanning image for cue case {CueCaseId}", cueCaseId);
                    // Continue - don't block upload if scanning fails
                }
            }

            uploadedImages.Add(new CueCaseImageDto
            {
                Id = caseImage.Id,
                ImageUrl = caseImage.ImageUrl,
                DisplayOrder = caseImage.DisplayOrder,
                IsPrimary = caseImage.IsPrimary,
                UploadedAt = caseImage.UploadedAt
            });

            _logger.LogInformation("Image {ImageId} uploaded for cue case {CueCaseId}", caseImage.Id, cueCaseId);
        }

        return uploadedImages;
    }

    public async Task<bool> DeleteImageAsync(int imageId, int userId)
    {
        var image = await _context.CueCaseImages
            .Include(i => i.CueCase)
            .FirstOrDefaultAsync(i => i.Id == imageId);

        if (image == null)
            return false;

        // Verify ownership
        if (image.CueCase?.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete images from your own listings");

        // Delete file from disk
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
                _logger.LogError(ex, "Failed to delete image file {FilePath}", filePath);
            }
        }

        // Remove from database
        _context.CueCaseImages.Remove(image);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} deleted by user {UserId}", imageId, userId);

        return true;
    }

    public async Task<bool> SetPrimaryImageAsync(int imageId, int cueCaseId, int userId)
    {
        var image = await _context.CueCaseImages
            .Include(i => i.CueCase)
            .FirstOrDefaultAsync(i => i.Id == imageId && i.CueCaseId == cueCaseId);

        if (image == null)
            return false;

        // Verify ownership
        if (image.CueCase?.UserId != userId)
            throw new UnauthorizedAccessException("You can only modify images from your own listings");

        // Unset other primary images
        var existingPrimary = await _context.CueCaseImages
            .Where(i => i.CueCaseId == cueCaseId && i.IsPrimary && i.Id != imageId)
            .ToListAsync();
        
        foreach (var img in existingPrimary)
        {
            img.IsPrimary = false;
        }

        // Set this image as primary
        image.IsPrimary = true;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Image {ImageId} set as primary for cue case {CueCaseId}", imageId, cueCaseId);

        return true;
    }

    public async Task<List<CueCaseImageDto>> GetCueCaseImagesAsync(int cueCaseId)
    {
        var images = await _context.CueCaseImages
            .Where(i => i.CueCaseId == cueCaseId)
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.DisplayOrder)
            .Select(i => new CueCaseImageDto
            {
                Id = i.Id,
                ImageUrl = i.ImageUrl,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            })
            .ToListAsync();

        return images;
    }

    /// <summary>
    /// Delete all images for a cue case without ownership checks (internal use)
    /// </summary>
    public async Task DeleteCueCaseImagesInternalAsync(int cueCaseId)
    {
        var images = await _context.CueCaseImages
            .Where(i => i.CueCaseId == cueCaseId)
            .ToListAsync();

        foreach (var image in images)
        {
            // Delete file from disk
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(_uploadPath, fileName);
            
            if (File.Exists(filePath))
            {
                try
                {
                    File.Delete(filePath);
                    _logger.LogInformation("Deleted image file {FilePath} for cue case {CueCaseId}", filePath, cueCaseId);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to delete image file {FilePath}", filePath);
                }
            }
        }

        // Remove all database records
        _context.CueCaseImages.RemoveRange(images);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted {Count} images for cue case {CueCaseId}", images.Count, cueCaseId);
    }

    private async Task DeleteCueCaseIfFlaggedAsync(int cueCaseId, int userId)
    {
        try
        {
            // Check if there are flagged images
            var hasFlaggedImages = await _context.FlaggedImages
                .AnyAsync(fi => fi.CueCaseId == cueCaseId && fi.Status == "pending");

            if (!hasFlaggedImages)
            {
                return;
            }

            // Get the cue case
            var cueCase = await _context.CueCases
                .Include(c => c.Images)
                .FirstOrDefaultAsync(c => c.Id == cueCaseId);

            if (cueCase == null)
            {
                _logger.LogWarning("CueCase {CueCaseId} not found for flagged deletion", cueCaseId);
                return;
            }

            // Delete all images for the case
            await DeleteCueCaseImagesInternalAsync(cueCaseId);

            // Delete the cue case itself
            _context.CueCases.Remove(cueCase);
            await _context.SaveChangesAsync();

            _logger.LogInformation("CueCase {CueCaseId} deleted due to flagged images", cueCaseId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting flagged cue case {CueCaseId}", cueCaseId);
            throw;
        }
    }
}
