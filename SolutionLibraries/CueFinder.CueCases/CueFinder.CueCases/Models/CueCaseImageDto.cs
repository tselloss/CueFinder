namespace CueFinder.CueCases.Models;

/// <summary>
/// DTO for cue case image information
/// </summary>
public class CueCaseImageDto
{
    public int Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
}
