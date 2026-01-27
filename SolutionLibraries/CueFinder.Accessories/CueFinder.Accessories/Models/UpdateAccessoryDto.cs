namespace CueFinder.Accessories.Models;

/// <summary>
/// DTO for updating an existing accessory listing
/// </summary>
public class UpdateAccessoryDto
{
    public string? Title { get; set; }
    public string? Brand { get; set; }
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string? Condition { get; set; }
    public string? AccessoryType { get; set; }
    public string? Material { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string? Location { get; set; }
    public bool? IsSold { get; set; }
}
