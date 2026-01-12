using CueFinder.CueCases.Models;
using Microsoft.AspNetCore.Http;

namespace CueFinder.CueCases.Interfaces;

/// <summary>
/// Service interface for cue case image operations
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload multiple images for a cue case
    /// </summary>
    Task<List<CueCaseImageDto>> UploadImagesAsync(int cueCaseId, List<IFormFile> files, int userId);
    
    /// <summary>
    /// Delete a specific image from a cue case
    /// </summary>
    Task<bool> DeleteImageAsync(int imageId, int userId);
    
    /// <summary>
    /// Set an image as the primary image for a cue case
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int imageId, int cueCaseId, int userId);
    
    /// <summary>
    /// Get all images for a specific cue case
    /// </summary>
    Task<List<CueCaseImageDto>> GetCueCaseImagesAsync(int cueCaseId);
    
    /// <summary>
    /// Delete all images for a cue case (internal use - no ownership check)
    /// </summary>
    Task DeleteCueCaseImagesInternalAsync(int cueCaseId);
}
