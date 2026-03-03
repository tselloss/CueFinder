using Microsoft.AspNetCore.Http;
using CueFinder.Accessories.Models;

namespace CueFinder.Accessories.Interfaces;

/// <summary>
/// Service interface for accessory image management
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload an image for an accessory (owner only)
    /// </summary>
    Task<AccessoryImageDto> UploadAccessoryImageAsync(int accessoryId, IFormFile file, int userId, string? altText = null, int displayOrder = 0, bool isPrimary = false);

    /// <summary>
    /// Upload multiple images for an accessory (owner only)
    /// </summary>
    Task<List<AccessoryImageDto>> UploadAccessoryImagesAsync(int accessoryId, List<IFormFile> files, int userId);

    /// <summary>
    /// Get all images for an accessory (public)
    /// </summary>
    Task<List<AccessoryImageDto>> GetAccessoryImagesAsync(int accessoryId);

    /// <summary>
    /// Get single image by id (public)
    /// </summary>
    Task<AccessoryImageDto?> GetAccessoryImageAsync(int imageId);

    /// <summary>
    /// Delete a single image (owner only)
    /// </summary>
    Task<bool> DeleteAccessoryImageAsync(int accessoryId, int imageId, int userId);

    /// <summary>
    /// Delete all images for an accessory (owner or admin)
    /// </summary>
    Task<bool> DeleteAccessoryImagesAsync(int accessoryId, int userId, bool isAdmin = false);

    /// <summary>
    /// Delete accessory images (internal use)
    /// </summary>
    Task<bool> DeleteAccessoryImagesInternalAsync(int accessoryId);

    /// <summary>
    /// Set primary image for an accessory (owner only)
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int accessoryId, int imageId, int userId);
}
