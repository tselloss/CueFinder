namespace CueFinder.CueSets.Models;

public class CueSetResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string Condition { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;

    public bool IncludesPlayingCue { get; set; }
    public bool IncludesBreakCue { get; set; }
    public bool IncludesJumpCue { get; set; }
    public bool IncludesCase { get; set; }

    public decimal? PlayingCueWeight { get; set; }
    public decimal? PlayingCueLength { get; set; }
    public decimal? PlayingCueTipSize { get; set; }
    public string? PlayingCueShaftMaterial { get; set; }
    public string? PlayingCueButtMaterial { get; set; }

    public decimal? BreakCueWeight { get; set; }
    public decimal? BreakCueLength { get; set; }
    public decimal? BreakCueTipSize { get; set; }
    public string? BreakCueShaftMaterial { get; set; }
    public string? BreakCueButtMaterial { get; set; }

    public decimal? JumpCueWeight { get; set; }
    public decimal? JumpCueLength { get; set; }
    public decimal? JumpCueTipSize { get; set; }
    public string? JumpCueShaftMaterial { get; set; }
    public string? JumpCueButtMaterial { get; set; }

    public string? CaseCapacity { get; set; }
    public string? CaseOpening { get; set; }
    public string? CaseType { get; set; }
    public string? CaseColor { get; set; }
    public string? CaseMaterial { get; set; }

    public string? Features { get; set; }

    public bool IsSold { get; set; }
    public DateTime? SoldDate { get; set; }
    public int UserId { get; set; }
    public string? UserName { get; set; }
    public int SellerId { get; set; }
    public string? SellerName { get; set; }
    public string? SellerEmail { get; set; }
    public string? SellerPhone { get; set; }
    public bool SellerHidePhone { get; set; }
    public bool SellerIsVerified { get; set; }
    public int ViewCount { get; set; }
    public decimal AverageRating { get; set; }
    public int RatingCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<CueSetImageDto> Images { get; set; } = new();
    public bool IsHidden { get; set; }
    public DateTime? HiddenAt { get; set; }
}
