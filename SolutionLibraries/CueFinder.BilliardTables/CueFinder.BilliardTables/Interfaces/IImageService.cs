using CueFinder.BilliardTables.Models;
using Microsoft.AspNetCore.Http;

namespace CueFinder.BilliardTables.Interfaces;

/// <summary>
/// Service interface for billiard table image management
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload multiple images for a billiard table (owner only)
    /// </summary>
    Task<List<BilliardTableImageDto>> UploadBilliardTableImagesAsync(int tableId, List<IFormFile> files, int userId);

    /// <summary>
    /// Get all images for a billiard table
    /// </summary>
    Task<List<BilliardTableImageDto>> GetBilliardTableImagesAsync(int tableId);

    /// <summary>
    /// Delete a single image (owner only)
    /// </summary>
    Task<bool> DeleteBilliardTableImageAsync(int tableId, int imageId, int userId);

    /// <summary>
    /// Delete all images for a billiard table
    /// </summary>
    Task<bool> DeleteBilliardTableImagesAsync(int tableId, int userId, bool isAdmin = false);

    /// <summary>
    /// Delete billiard table images (internal use, no ownership check)
    /// </summary>
    Task<bool> DeleteBilliardTableImagesInternalAsync(int tableId);

    /// <summary>
    /// Set primary image for a billiard table (owner only)
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int tableId, int imageId, int userId);
}
