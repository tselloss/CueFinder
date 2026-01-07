namespace CueFinder.CueCases.Models;

/// <summary>
/// DTO for uploading images to a cue case
/// </summary>
public class ImageUploadDto
{
    public string ImageData { get; set; } = string.Empty; // Base64 encoded image
    public bool IsPrimary { get; set; }
    public int DisplayOrder { get; set; }
}
