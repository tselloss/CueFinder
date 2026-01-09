namespace CueFinder.CueCases.Models;

/// <summary>
/// DTO for cue case response with all details
/// </summary>
public class CueCaseResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string CaseCapacity { get; set; } = string.Empty;
    public string CaseOpening { get; set; } = string.Empty;
    public string CaseType { get; set; } = string.Empty;
    public string? Color { get; set; }
    public string? CaseMaterial { get; set; }
    public string? OuterDimensions { get; set; }
    public string? PocketSpace { get; set; }
    public string? HandleExtensionSpace { get; set; }
    public string? CaseWeight { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool IsSold { get; set; }
    public DateTime? SoldDate { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    
    // Seller info (duplicated for convenience/consistency with cues API)
    public int SellerId { get; set; }
    public string? SellerName { get; set; }
    public string? SellerEmail { get; set; }
    public string? SellerPhone { get; set; }
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CueCaseImageDto> Images { get; set; } = new();
}
