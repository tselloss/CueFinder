using Microsoft.EntityFrameworkCore;
using System.IO;
using System.Linq;

namespace CueFinder.Models
{
    /// <summary>
    /// Implementation of image upload and storage service
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

        /// <summary>
        /// Upload a single image for a cue
        /// </summary>
        public async Task<ImageUploadResponse> UploadImageAsync(ImageUploadRequest request, int userId)
        {
            try
            {
                // Validate the image file
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

                // Save image file to disk
                var fileName = $"{request.CueId}_{Guid.NewGuid()}{Path.GetExtension(request.File.FileName)}";
                var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "cues");
                Directory.CreateDirectory(uploadsFolder);
                var filePath = Path.Combine(uploadsFolder, fileName);
                
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await request.File.CopyToAsync(stream);
                }

                var imageUrl = $"/uploads/cues/{fileName}";
                var contentType = request.File.ContentType;

                // If set as primary, remove primary flag from other images
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

                // Create CueImage record in database with file path
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

        /// <summary>
        /// Upload multiple images at once
        /// </summary>
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
                    IsPrimary = displayOrder == 1 // First image is primary
                };

                var response = await UploadImageAsync(request, userId);
                responses.Add(response);
            }

            return responses;
        }

        /// <summary>
        /// Delete an image from storage and database
        /// </summary>
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

                // Verify user owns the cue
                if (image.Cue?.UserId != userId)
                {
                    _logger.LogWarning("User {UserId} attempted to delete image {ImageId} they don't own", userId, imageId);
                    return false;
                }

                // Extract filename from URL and delete physical file
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, _settings.StoragePath, fileName);

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                }

                // Remove from database
                _context.CueImages.Remove(image);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Image {ImageId} deleted successfully", imageId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
                return false;
            }
        }

        /// <summary>
        /// Get image by ID
        /// </summary>
        public async Task<CueImage?> GetImageAsync(int imageId)
        {
            return await _context.CueImages.FirstOrDefaultAsync(ci => ci.Id == imageId);
        }

        /// <summary>
        /// Get all images for a cue
        /// </summary>
        public async Task<List<CueImage>> GetCueImagesAsync(int cueId)
        {
            return await _context.CueImages
                .Where(ci => ci.CueId == cueId)
                .OrderBy(ci => ci.DisplayOrder)
                .ToListAsync();
        }

        /// <summary>
        /// Set primary/thumbnail image for a cue
        /// </summary>
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

                // Remove primary flag from other images
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

        /// <summary>
        /// Update image display order
        /// </summary>
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

        /// <summary>
        /// Delete all images for a cue
        /// </summary>
        public async Task<bool> DeleteCueImagesAsync(int cueId, int userId)
        {
            try
            {
                var cue = await _context.Cues.FirstOrDefaultAsync(c => c.Id == cueId);
                if (cue?.UserId != userId)
                {
                    return false;
                }

                var images = await _context.CueImages
                    .Where(ci => ci.CueId == cueId)
                    .ToListAsync();

                foreach (var image in images)
                {
                    var fileName = Path.GetFileName(image.ImageUrl);
                    var filePath = Path.Combine(_webHostEnvironment.WebRootPath, _settings.StoragePath, fileName);

                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                    }

                    _context.CueImages.Remove(image);
                }

                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all images for cue {CueId}", cueId);
                return false;
            }
        }

        /// <summary>
        /// Validate image file before upload
        /// </summary>
        public async Task<(bool IsValid, string? ErrorMessage)> ValidateImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return (false, "No file provided");
            }

            // Check file size
            if (file.Length > _settings.MaxFileSizeBytes)
            {
                var maxSizeMB = _settings.MaxFileSizeBytes / (1024 * 1024);
                return (false, $"File size exceeds maximum of {maxSizeMB}MB");
            }

            // Check file extension
            var extension = Path.GetExtension(file.FileName).ToLower();
            var allowedExtensions = _settings.AllowedExtensions.Split(',').Select(e => e.Trim()).ToList();

            if (!allowedExtensions.Contains(extension))
            {
                return (false, $"File extension '{extension}' is not allowed. Allowed: {_settings.AllowedExtensions}");
            }

            // Check MIME type
            var allowedMimeTypes = _settings.AllowedMimeTypes.Split(',').Select(m => m.Trim()).ToList();
            if (!allowedMimeTypes.Contains(file.ContentType))
            {
                return (false, $"File type '{file.ContentType}' is not allowed");
            }

            return (true, null);
        }

        /// <summary>
        /// Get image URL for public access
        /// </summary>
        public string GetImageUrl(string fileName)
        {
            return $"{_settings.ImageUrlBase}/{fileName}";
        }

        /// <summary>
        /// Generate unique filename to avoid conflicts
        /// </summary>
        private string GenerateUniqueFileName(string originalFileName)
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmssffff");
            var extension = Path.GetExtension(originalFileName).ToLower();
            var random = new Random().Next(1000, 9999);
            return $"{timestamp}_{random}{extension}";
        }
    }
}
