namespace CueFinder.Extensions.Images;

/// <summary>
/// Response model for image uploads.
/// </summary>
public class ImageUploadResponse
{
    /// <summary>
    /// Whether the upload was successful.
    /// </summary>
    public bool Success { get; set; }

    /// <summary>
    /// ID of the uploaded image.
    /// </summary>
    public int ImageId { get; set; }

    /// <summary>
    /// URL of the uploaded image.
    /// </summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>
    /// File size in bytes.
    /// </summary>
    public long FileSize { get; set; }

    /// <summary>
    /// MIME type of the file.
    /// </summary>
    public string MimeType { get; set; } = string.Empty;

    /// <summary>
    /// Error message if upload failed.
    /// </summary>
    public string? ErrorMessage { get; set; }

    /// <summary>
    /// Whether this is the primary image.
    /// </summary>
    public bool IsPrimary { get; set; }

    /// <summary>
    /// Timestamp of the upload.
    /// </summary>
    public DateTime UploadedAt { get; set; }
}
