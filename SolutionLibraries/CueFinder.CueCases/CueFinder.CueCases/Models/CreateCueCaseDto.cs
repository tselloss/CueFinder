namespace CueFinder.CueCases.Models;

/// <summary>
/// DTO for creating a new cue case listing
/// </summary>
public class CreateCueCaseDto
{
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string CaseCapacity { get; set; } = string.Empty; // 1x1, 1x2, 2x4, 3x5, 4x8
    public string CaseOpening { get; set; } = string.Empty; // Butterfly, Top Open, Side Open, Zipper
    public string CaseType { get; set; } = string.Empty; // Soft, Hard, Semi-Hard
    public string? Color { get; set; }
    public string? CaseMaterial { get; set; }
    public string? OuterDimensions { get; set; }
    public string? PocketSpace { get; set; } // None, Small, Medium, Large, Very Large
    public string? HandleExtensionSpace { get; set; }
    public string? CaseWeight { get; set; }
    public string? Location { get; set; }
}
