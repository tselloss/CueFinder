namespace CueFinder.CueCases.Models;

/// <summary>
/// DTO for updating an existing cue case listing
/// </summary>
public class UpdateCueCaseDto
{
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? Condition { get; set; }
    public string? CaseCapacity { get; set; }
    public string? CaseOpening { get; set; }
    public string? CaseType { get; set; }
    public string? Color { get; set; }
    public string? CaseMaterial { get; set; }
    public string? OuterDimensions { get; set; }
    public string? PocketSpace { get; set; }
    public string? HandleExtensionSpace { get; set; }
    public string? CaseWeight { get; set; }
    public string? Location { get; set; }
    public bool? IsSold { get; set; }
    public bool? IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
    public DateTime? LastUserResponseAt { get; set; }
}
