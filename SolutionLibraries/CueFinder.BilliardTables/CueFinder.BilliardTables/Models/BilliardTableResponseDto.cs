namespace CueFinder.BilliardTables.Models;

/// <summary>
/// DTO for billiard table listing response
/// </summary>
public class BilliardTableResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string TableSize { get; set; } = string.Empty;
    public string TableType { get; set; } = string.Empty;
    public string PlayingSurface { get; set; } = string.Empty;
    public string FeltType { get; set; } = string.Empty;
    public string FrameMaterial { get; set; } = string.Empty;
    public string? PocketType { get; set; }
    public string? Features { get; set; }
    public int? ManufactureYear { get; set; }
    public string Condition { get; set; } = string.Empty;
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
    public bool SellerIsVerified { get; set; }
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
    public List<BilliardTableImageDto> Images { get; set; } = new();
    // Hidden status
    public bool IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
}
