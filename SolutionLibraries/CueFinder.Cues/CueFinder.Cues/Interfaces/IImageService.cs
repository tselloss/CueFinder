using CueFinder.Cues.Models;
using Microsoft.AspNetCore.Http;

namespace CueFinder.Cues.Interfaces;

/// <summary>
/// Service interface for image management operations
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload an image for a cue
    /// </summary>
    Task<CueImageDto> UploadImageAsync(int cueId, IFormFile image, int userId, string? altText = null, int displayOrder = 0, bool isPrimary = false);
    
    /// <summary>
    /// Get all images for a specific cue
    /// </summary>
    Task<List<CueImageDto>> GetCueImagesAsync(int cueId);
    
    /// <summary>
    /// Get a specific image by ID
    /// </summary>
    Task<CueImageDto?> GetImageByIdAsync(int imageId);
    
    /// <summary>
    /// Delete an image (only by cue owner or admin)
    /// </summary>
    Task<bool> DeleteImageAsync(int imageId, int userId, bool isAdmin = false);
    
    /// <summary>
    /// Set an image as primary for a cue
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int imageId, int userId);
    
    /// <summary>
    /// Update image display order
    /// </summary>
    Task<bool> UpdateImageOrderAsync(int imageId, int newOrder, int userId);
}
