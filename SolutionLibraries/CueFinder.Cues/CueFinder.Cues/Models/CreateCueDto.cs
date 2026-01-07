namespace CueFinder.Cues.Models;

/// <summary>
/// DTO for creating a new cue listing
/// </summary>
public class CreateCueDto
{
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty; // New, Used, Like New
    public string? Material { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Length { get; set; }
    public decimal? TipSize { get; set; }
    public string? Location { get; set; }
}
