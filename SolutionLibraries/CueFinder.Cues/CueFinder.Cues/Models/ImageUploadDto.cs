using Microsoft.AspNetCore.Http;

namespace CueFinder.Cues.Models;

/// <summary>
/// DTO for uploading images to a cue
/// </summary>
public class ImageUploadDto
{
    public IFormFile Image { get; set; } = null!;
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
}
