using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace CueFinder.Extensions.Images;

/// <summary>
/// Implementation of image upload and disk storage service.
/// Stores files under wwwroot/{StoragePath}/{cueId}/...
/// </summary>
public class ImageService : IImageService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<ImageService> _logger;
    private readonly ImageStorageSettings _settings;
    private readonly IWebHostEnvironment _webHostEnvironment;

    public ImageService(
        CueFinderDbContext context,
        ILogger<ImageService> logger,
        IOptions<ImageStorageSettings> settings,
        IWebHostEnvironment webHostEnvironment)
    {
        _context = context;
        _logger = logger;
        _settings = settings.Value;
        _webHostEnvironment = webHostEnvironment;
    }

    private string GetCueFolderPath(int cueId)
    {
        // If StoragePath is absolute, use it directly; otherwise combine with WebRootPath
        var storageRoot = Path.IsPathRooted(_settings.StoragePath)
            ? _settings.StoragePath
            : Path.Combine(_webHostEnvironment.WebRootPath, _settings.StoragePath);
        return Path.Combine(storageRoot, cueId.ToString());
    }

    private string GetCueFolderUrl(int cueId)
    {
        return $"{_settings.ImageUrlBase}/{cueId}";
    }

    public void EnsureStorageRootExists()
    {
        // If StoragePath is absolute, use it directly; otherwise combine with WebRootPath
        var storageRoot = Path.IsPathRooted(_settings.StoragePath)
            ? _settings.StoragePath
            : Path.Combine(_webHostEnvironment.WebRootPath, _settings.StoragePath);
        Directory.CreateDirectory(storageRoot);
    }

    public async Task<ImageUploadResponse> UploadImageAsync(ImageUploadRequest request, int userId)
    {
        try
        {
            var (isValid, errorMessage) = await ValidateImageAsync(request.File);
            if (!isValid)
            {
                return new ImageUploadResponse
                {
                    Success = false,
                    ErrorMessage = errorMessage,
                    UploadedAt = DateTime.UtcNow
                };
            }

            // Verify user owns the cue
            var cue = await _context.Cues.FirstOrDefaultAsync(c => c.Id == request.CueId && c.UserId == userId);
            if (cue == null)
            {
                return new ImageUploadResponse
                {
                    Success = false,
                    ErrorMessage = "Cue not found or you don't have permission to upload images",
                    UploadedAt = DateTime.UtcNow
                };
            }

            EnsureStorageRootExists();
            var cueFolder = GetCueFolderPath(request.CueId);
            Directory.CreateDirectory(cueFolder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(request.File.FileName)}";
            var filePath = Path.Combine(cueFolder, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            var imageUrl = $"{GetCueFolderUrl(request.CueId)}/{fileName}";
            var contentType = request.File.ContentType;

            if (request.IsPrimary)
            {
                var otherPrimaryImages = await _context.CueImages
                    .Where(ci => ci.CueId == request.CueId && ci.IsPrimary)
                    .ToListAsync();

                foreach (var img in otherPrimaryImages)
                {
                    img.IsPrimary = false;
                }
            }

            var cueImage = new CueImage
            {
                CueId = request.CueId,
                ImageUrl = imageUrl,
                ContentType = contentType,
                AltText = request.AltText ?? $"Cue image {request.DisplayOrder}",
                DisplayOrder = request.DisplayOrder,
                IsPrimary = request.IsPrimary,
                UploadedAt = DateTime.UtcNow
            };

            _context.CueImages.Add(cueImage);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Image uploaded successfully for cue {CueId} by user {UserId}", request.CueId, userId);

            return new ImageUploadResponse
            {
                Success = true,
                ImageId = cueImage.Id,
                ImageUrl = cueImage.ImageUrl,
                FileSize = request.File.Length,
                MimeType = contentType,
                UploadedAt = cueImage.UploadedAt
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for cue {CueId}", request.CueId);
            return new ImageUploadResponse
            {
                Success = false,
                ErrorMessage = "An error occurred while uploading the image",
                UploadedAt = DateTime.UtcNow
            };
        }
    }

    public async Task<List<ImageUploadResponse>> UploadMultipleImagesAsync(List<IFormFile> files, int cueId, int userId)
    {
        var responses = new List<ImageUploadResponse>();
        var displayOrder = 0;

        foreach (var file in files)
        {
            var request = new ImageUploadRequest
            {
                File = file,
                CueId = cueId,
                DisplayOrder = displayOrder++,
                IsPrimary = displayOrder == 1
            };

            responses.Add(await UploadImageAsync(request, userId));
        }

        return responses;
    }

    public async Task<bool> DeleteImageAsync(int imageId, int userId)
    {
        try
        {
            var image = await _context.CueImages
                .Include(ci => ci.Cue)
                .FirstOrDefaultAsync(ci => ci.Id == imageId);

            if (image == null)
            {
                _logger.LogWarning("Image {ImageId} not found", imageId);
                return false;
            }

            if (image.Cue?.UserId != userId)
            {
                _logger.LogWarning("User {UserId} attempted to delete image {ImageId} they don't own", userId, imageId);
                return false;
            }

            var fileName = Path.GetFileName(image.ImageUrl);
            var folder = GetCueFolderPath(image.CueId);
            var filePath = Path.Combine(folder, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }

            _context.CueImages.Remove(image);
            await _context.SaveChangesAsync();

            TryDeleteCueFolderIfEmpty(image.CueId);

            _logger.LogInformation("Image {ImageId} deleted successfully", imageId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
            return false;
        }
    }

    public Task<CueImage?> GetImageAsync(int imageId)
    {
        return _context.CueImages.FirstOrDefaultAsync(ci => ci.Id == imageId);
    }

    public Task<List<CueImage>> GetCueImagesAsync(int cueId)
    {
        return _context.CueImages
            .Where(ci => ci.CueId == cueId)
            .OrderBy(ci => ci.DisplayOrder)
            .ToListAsync();
    }

    public async Task<bool> SetPrimaryImageAsync(int imageId, int userId)
    {
        try
        {
            var image = await _context.CueImages
                .Include(ci => ci.Cue)
                .FirstOrDefaultAsync(ci => ci.Id == imageId);

            if (image == null || image.Cue?.UserId != userId)
            {
                return false;
            }

            var otherPrimary = await _context.CueImages
                .Where(ci => ci.CueId == image.CueId && ci.IsPrimary)
                .ToListAsync();

            foreach (var img in otherPrimary)
            {
                img.IsPrimary = false;
            }

            image.IsPrimary = true;
            await _context.SaveChangesAsync();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
            return false;
        }
    }

    public async Task<bool> UpdateImageOrderAsync(int imageId, int newOrder)
    {
        try
        {
            var image = await _context.CueImages.FirstOrDefaultAsync(ci => ci.Id == imageId);
            if (image == null)
            {
                return false;
            }

            image.DisplayOrder = newOrder;
            await _context.SaveChangesAsync();
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating image order for {ImageId}", imageId);
            return false;
        }
    }

    public async Task<bool> DeleteCueImagesAsync(int cueId, int userId)
    {
        try
        {
            var cue = await _context.Cues.FirstOrDefaultAsync(c => c.Id == cueId);
            if (cue?.UserId != userId)
            {
                return false;
            }

            await DeleteCueImagesInternalAsync(cueId);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting all images for cue {CueId}", cueId);
            return false;
        }
    }

    public async Task DeleteCueImagesInternalAsync(int cueId)
    {
        var images = await _context.CueImages
            .Where(ci => ci.CueId == cueId)
            .ToListAsync();

        foreach (var image in images)
        {
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(GetCueFolderPath(cueId), fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            _context.CueImages.Remove(image);
        }

        await _context.SaveChangesAsync();

        TryDeleteCueFolder(cueId);
    }

    private void TryDeleteCueFolderIfEmpty(int cueId)
    {
        try
        {
            var folder = GetCueFolderPath(cueId);
            if (Directory.Exists(folder) && !Directory.EnumerateFileSystemEntries(folder).Any())
            {
                Directory.Delete(folder, recursive: false);
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Unable to delete empty cue image folder for cue {CueId}", cueId);
        }
    }

    private void TryDeleteCueFolder(int cueId)
    {
        try
        {
            var folder = GetCueFolderPath(cueId);
            if (Directory.Exists(folder))
            {
                Directory.Delete(folder, recursive: true);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Unable to delete cue image folder for cue {CueId}", cueId);
        }
    }

    public Task<(bool IsValid, string? ErrorMessage)> ValidateImageAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return Task.FromResult<(bool, string?)>((false, "No file provided"));
        }

        if (file.Length > _settings.MaxFileSizeBytes)
        {
            var maxSizeMB = _settings.MaxFileSizeBytes / (1024 * 1024);
            return Task.FromResult<(bool, string?)>((false, $"File size exceeds maximum of {maxSizeMB}MB"));
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = _settings.AllowedExtensions.Split(',').Select(e => e.Trim()).ToList();
        if (!allowedExtensions.Contains(extension))
        {
            return Task.FromResult<(bool, string?)>((false, $"File extension '{extension}' is not allowed. Allowed: {_settings.AllowedExtensions}"));
        }

        var allowedMimeTypes = _settings.AllowedMimeTypes.Split(',').Select(m => m.Trim()).ToList();
        if (!allowedMimeTypes.Contains(file.ContentType))
        {
            return Task.FromResult<(bool, string?)>((false, $"File type '{file.ContentType}' is not allowed"));
        }

        return Task.FromResult<(bool, string?)>((true, null));
    }

    public string GetImageUrl(string fileName)
    {
        return $"{_settings.ImageUrlBase}/{fileName}";
    }
}
