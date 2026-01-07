namespace CueFinder.Cues.Models;

/// <summary>
/// DTO for cue image information
/// </summary>
public class CueImageDto
{
    public int Id { get; set; }
    public int CueId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
}
