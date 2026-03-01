namespace CueFinder.Cues.Models;

/// <summary>
/// DTO for cue response with images
/// </summary>
public class CueResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string CueType { get; set; } = "playing";
    public string? Material { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Length { get; set; }
    public decimal? TipSize { get; set; }
    public string? Location { get; set; }
    public bool IsSold { get; set; }
    public int ViewCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Seller info
    public int SellerId { get; set; }
    public string? SellerName { get; set; }
    public string? SellerEmail { get; set; }
    public string? SellerPhone { get; set; }
    public bool SellerHidePhone { get; set; }
    
    // Images
    public List<CueImageDto> Images { get; set; } = new();
    
    // Ratings
    public double AverageRating { get; set; }
    public int RatingCount { get; set; }
    // Hidden status
    public bool IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
}
