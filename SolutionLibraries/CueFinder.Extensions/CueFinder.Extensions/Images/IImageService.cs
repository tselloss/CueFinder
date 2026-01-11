using CueFinder.Database.Models;
using Microsoft.AspNetCore.Http;

namespace CueFinder.Extensions.Images;

/// <summary>
/// Interface for image upload and storage operations.
/// </summary>
public interface IImageService
{
    Task<ImageUploadResponse> UploadImageAsync(ImageUploadRequest request, int userId);
    Task<List<ImageUploadResponse>> UploadMultipleImagesAsync(List<IFormFile> files, int cueId, int userId);
    Task<bool> DeleteImageAsync(int imageId, int userId);
    Task<CueImage?> GetImageAsync(int imageId);
    Task<List<CueImage>> GetCueImagesAsync(int cueId);
    Task<bool> SetPrimaryImageAsync(int imageId, int userId);
    Task<bool> UpdateImageOrderAsync(int imageId, int newOrder);
    Task<bool> DeleteCueImagesAsync(int cueId, int userId);

    /// <summary>
    /// Delete all images for a cue without requiring ownership checks.
    /// Intended for internal/service usage (e.g., admin deletes, listing sold/removed).
    /// </summary>
    Task DeleteCueImagesInternalAsync(int cueId);

    /// <summary>
    /// Ensure the image storage directory exists at application startup.
    /// </summary>
    void EnsureStorageRootExists();

    Task<(bool IsValid, string? ErrorMessage)> ValidateImageAsync(IFormFile file);
    string GetImageUrl(string fileName);
}
