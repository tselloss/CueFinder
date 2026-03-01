namespace CueFinder.Accessories.Models;

/// <summary>
/// DTO for accessory listing response
/// </summary>
public class AccessoryResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string AccessoryType { get; set; } = string.Empty;
    public string? Material { get; set; }
    public string? Size { get; set; }
    public string? Color { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsSold { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int SellerId { get; set; }
    public string SellerName { get; set; } = string.Empty;
    public string SellerEmail { get; set; } = string.Empty;
    public string? SellerPhone { get; set; }
    public bool SellerHidePhone { get; set; }
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
    public List<AccessoryImageDto> Images { get; set; } = new();
    // Hidden status
    public bool IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
}
