namespace CueFinder.Cues.Models;

/// <summary>
/// DTO for updating an existing cue listing
/// </summary>
public class UpdateCueDto
{
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? Condition { get; set; }
    public string? Material { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Length { get; set; }
    public decimal? TipSize { get; set; }
    public string? Location { get; set; }
    public bool? IsSold { get; set; }
}
