namespace CueFinder.BilliardTables.Interfaces;

/// <summary>
/// Service interface for billiard table image management
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload an image for a billiard table
    /// </summary>
    Task<string> UploadBilliardTableImageAsync(int tableId, Stream imageStream, string fileName);
    
    /// <summary>
    /// Delete all images for a billiard table
    /// </summary>
    Task<bool> DeleteBilliardTableImagesAsync(int tableId);
    
    /// <summary>
    /// Delete billiard table images (internal use)
    /// </summary>
    Task<bool> DeleteBilliardTableImagesInternalAsync(int tableId);
    
    /// <summary>
    /// Set primary image for a billiard table
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int tableId, int imageId);
}
