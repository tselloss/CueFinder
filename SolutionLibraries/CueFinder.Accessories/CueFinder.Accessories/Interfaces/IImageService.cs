namespace CueFinder.Accessories.Interfaces;

/// <summary>
/// Service interface for accessory image management
/// </summary>
public interface IImageService
{
    /// <summary>
    /// Upload an image for an accessory
    /// </summary>
    Task<string> UploadAccessoryImageAsync(int accessoryId, Stream imageStream, string fileName);
    
    /// <summary>
    /// Delete all images for an accessory
    /// </summary>
    Task<bool> DeleteAccessoryImagesAsync(int accessoryId);
    
    /// <summary>
    /// Delete accessory images (internal use)
    /// </summary>
    Task<bool> DeleteAccessoryImagesInternalAsync(int accessoryId);
    
    /// <summary>
    /// Set primary image for an accessory
    /// </summary>
    Task<bool> SetPrimaryImageAsync(int accessoryId, int imageId);
}
