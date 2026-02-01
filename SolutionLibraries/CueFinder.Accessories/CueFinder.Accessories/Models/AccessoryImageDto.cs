namespace CueFinder.Accessories.Models;

/// <summary>
/// DTO for accessory image information
/// </summary>
public class AccessoryImageDto
{
    public int Id { get; set; }
    public int AccessoryId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string? AltText { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
}
