using CueFinder.Cues.Models;
using CueFinder.Database.Models;

namespace CueFinder.Cues.Services;

/// <summary>
/// Service implementation for cue management
/// Partial class: Mapping and DTO conversion
/// </summary>
public partial class CueService
{
    private CueResponseDto MapToCueResponseDto(Cue cue)
    {
        return new CueResponseDto
        {
            Id = cue.Id,
            Title = cue.Title,
            Brand = cue.Brand,
            Description = cue.Description,
            Price = cue.Price,
            Condition = cue.Condition,
            CueType = cue.CueType,
            Material = cue.ShaftMaterial,
            Weight = cue.Weight,
            Length = cue.Length,
            TipSize = cue.TipSize,
            Location = cue.Location,
            IsSold = cue.IsSold,
            ViewCount = cue.ViewCount,
            CreatedAt = cue.CreatedAt,
            UpdatedAt = cue.UpdatedAt,
            SellerId = cue.UserId,
            SellerName = cue.User?.Name ?? string.Empty,
            SellerEmail = cue.User?.Email ?? string.Empty,
            SellerPhone = cue.User?.Phone ?? string.Empty,
            SellerHidePhone = cue.User?.HidePhone ?? false,
            SellerIsVerified = cue.User?.IsVerified ?? false,
            Images = cue.Images?.Select(i => new CueImageDto
            {
                Id = i.Id,
                CueId = i.CueId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<CueImageDto>(),
            AverageRating = (double)cue.AverageRating,
            RatingCount = cue.RatingCount,
            IsHidden = cue.IsHidden,
            HiddenAt = cue.HiddenAt
        };
    }
}
