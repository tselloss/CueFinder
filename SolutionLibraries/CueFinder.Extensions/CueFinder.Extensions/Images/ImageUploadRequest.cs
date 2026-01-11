using Microsoft.AspNetCore.Http;

namespace CueFinder.Extensions.Images;

/// <summary>
/// Request model for uploading cue images.
/// </summary>
public class ImageUploadRequest
{
    /// <summary>
    /// The image file to upload.
    /// </summary>
    public IFormFile File { get; set; } = null!;

    /// <summary>
    /// ID of the cue this image belongs to.
    /// </summary>
    public int CueId { get; set; }

    /// <summary>
    /// Alternative text for accessibility.
    /// </summary>
    public string? AltText { get; set; }

    /// <summary>
    /// Display order for the image.
    /// </summary>
    public int DisplayOrder { get; set; } = 0;

    /// <summary>
    /// Whether this should be the primary/thumbnail image.
    /// </summary>
    public bool IsPrimary { get; set; } = false;
}
