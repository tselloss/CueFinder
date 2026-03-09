using CueFinder.CueSets.Models;
using CueFinder.Database.Models;

namespace CueFinder.CueSets.Services;

public partial class CueSetService
{
    private static CueSetResponseDto MapToCueSetResponseDto(CueSet set)
    {
        return new CueSetResponseDto
        {
            Id = set.Id,
            Title = set.Title,
            Brand = set.Brand,
            Description = set.Description,
            Price = set.Price,
            Condition = set.Condition,
            Location = set.Location,
            IncludesPlayingCue = set.IncludesPlayingCue,
            IncludesBreakCue = set.IncludesBreakCue,
            IncludesJumpCue = set.IncludesJumpCue,
            IncludesCase = set.IncludesCase,
            PlayingCueWeight = set.PlayingCueWeight,
            PlayingCueLength = set.PlayingCueLength,
            PlayingCueTipSize = set.PlayingCueTipSize,
            PlayingCueShaftMaterial = set.PlayingCueShaftMaterial,
            PlayingCueButtMaterial = set.PlayingCueButtMaterial,
            BreakCueWeight = set.BreakCueWeight,
            BreakCueLength = set.BreakCueLength,
            BreakCueTipSize = set.BreakCueTipSize,
            BreakCueShaftMaterial = set.BreakCueShaftMaterial,
            BreakCueButtMaterial = set.BreakCueButtMaterial,
            JumpCueWeight = set.JumpCueWeight,
            JumpCueLength = set.JumpCueLength,
            JumpCueTipSize = set.JumpCueTipSize,
            JumpCueShaftMaterial = set.JumpCueShaftMaterial,
            JumpCueButtMaterial = set.JumpCueButtMaterial,
            CaseCapacity = set.CaseCapacity,
            CaseOpening = set.CaseOpening,
            CaseType = set.CaseType,
            CaseColor = set.CaseColor,
            CaseMaterial = set.CaseMaterial,
            Features = set.Features,
            IsSold = set.IsSold,
            SoldDate = set.SoldDate,
            UserId = set.UserId,
            UserName = set.User?.Username,
            SellerId = set.UserId,
            SellerName = set.User?.Name ?? set.User?.Username,
            SellerEmail = set.User?.Email,
            SellerPhone = set.User?.Phone,
            SellerHidePhone = set.User?.HidePhone ?? false,
            SellerIsVerified = set.User?.IsVerified ?? false,
            ViewCount = set.ViewCount,
            AverageRating = set.AverageRating,
            RatingCount = set.RatingCount,
            CreatedAt = set.CreatedAt,
            UpdatedAt = set.UpdatedAt,
            Images = set.Images?.Select(img => new CueSetImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                DisplayOrder = img.DisplayOrder,
                IsPrimary = img.IsPrimary,
                UploadedAt = img.UploadedAt
            }).OrderBy(img => img.DisplayOrder).ToList() ?? new List<CueSetImageDto>(),
            IsHidden = set.IsHidden,
            HiddenAt = set.HiddenAt
        };
    }
}
