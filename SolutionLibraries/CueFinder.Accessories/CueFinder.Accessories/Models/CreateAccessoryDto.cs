namespace CueFinder.Accessories.Models;

/// <summary>
/// DTO for creating a new accessory listing
/// </summary>
public class CreateAccessoryDto
{
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty; // New, Used, Like New
    public string AccessoryType { get; set; } = string.Empty; // Gloves, Tips, Chalk, etc.
    public string? Material { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Location { get; set; }
}
