namespace CueFinder.Extensions.Images;

/// <summary>
/// Configuration for image storage settings.
/// </summary>
public class ImageStorageSettings
{
    /// <summary>
    /// Base directory for storing uploaded images (relative to WebRootPath).
    /// Default: uploads/cues
    /// </summary>
    public string StoragePath { get; set; } = "uploads/cues";

    /// <summary>
    /// Base URL for accessing uploaded images.
    /// Default: /uploads/cues
    /// </summary>
    public string ImageUrlBase { get; set; } = "/uploads/cues";

    /// <summary>
    /// Maximum file size in bytes (default 10MB).
    /// </summary>
    public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

    /// <summary>
    /// Allowed file extensions (comma-separated).
    /// </summary>
    public string AllowedExtensions { get; set; } = ".jpg,.jpeg,.png,.gif,.webp";

    /// <summary>
    /// Allowed MIME types (comma-separated).
    /// </summary>
    public string AllowedMimeTypes { get; set; } = "image/jpeg,image/png,image/gif,image/webp";
}
