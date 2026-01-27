namespace CueFinder.BilliardTables.Models;

/// <summary>
/// DTO for updating an existing billiard table listing
/// </summary>
public class UpdateBilliardTableDto
{
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? TableSize { get; set; }
    public string? TableType { get; set; }
    public string? PlayingSurface { get; set; }
    public string? FeltType { get; set; }
    public string? FrameMaterial { get; set; }
    public string? PocketType { get; set; }
    public string? Features { get; set; }
    public int? ManufactureYear { get; set; }
    public string? Condition { get; set; }
    public string? Location { get; set; }
    public bool? IsSold { get; set; }
}
