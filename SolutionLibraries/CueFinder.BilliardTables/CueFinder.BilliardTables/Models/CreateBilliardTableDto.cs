namespace CueFinder.BilliardTables.Models;

/// <summary>
/// DTO for creating a new billiard table listing
/// </summary>
public class CreateBilliardTableDto
{
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string TableSize { get; set; } = "8-foot"; // 7-foot, 8-foot, 9-foot, 10-foot
    public string TableType { get; set; } = "pool"; // pool, snooker, billiards, combination
    public string PlayingSurface { get; set; } = string.Empty; // slate, hybrid, synthetic
    public string FeltType { get; set; } = string.Empty;
    public string FrameMaterial { get; set; } = string.Empty;
    public string? PocketType { get; set; }
    public string? Features { get; set; }
    public int? ManufactureYear { get; set; }
    public string Condition { get; set; } = "good"; // mint, excellent, good, fair, poor
    public string? Location { get; set; }
}
