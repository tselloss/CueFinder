using CueFinder.CueCases.Models;
using CueFinder.Database.Models;

namespace CueFinder.CueCases.Services;

/// <summary>
/// Service implementation for cue case management
/// Partial class: Mapping and DTO conversion
/// </summary>
public partial class CueCaseService
{
    private static CueCaseResponseDto MapToCueCaseResponseDto(CueCase cueCase)
    {
        return new CueCaseResponseDto
        {
            Id = cueCase.Id,
            Title = cueCase.Title,
            Brand = cueCase.Brand,
            Description = cueCase.Description,
            Price = cueCase.Price,
            Condition = cueCase.Condition,
            CaseCapacity = cueCase.CaseCapacity,
            CaseOpening = cueCase.CaseOpening,
            CaseType = cueCase.CaseType,
            Color = cueCase.Color,
            CaseMaterial = cueCase.CaseMaterial,
            OuterDimensions = cueCase.OuterDimensions,
            PocketSpace = cueCase.PocketSpace,
            HandleExtensionSpace = cueCase.HandleExtensionSpace,
            CaseWeight = cueCase.CaseWeight,
            Location = cueCase.Location,
            IsSold = cueCase.IsSold,
            SoldDate = cueCase.SoldDate,
            UserId = cueCase.UserId,
            UserName = cueCase.User?.Username,
            SellerId = cueCase.UserId,
            SellerName = cueCase.User?.Name ?? cueCase.User?.Username,
            SellerEmail = cueCase.User?.Email,
            SellerPhone = cueCase.User?.Phone,
            SellerHidePhone = cueCase.User?.HidePhone ?? false,
            SellerIsVerified = cueCase.User?.IsVerified ?? false,
            ViewCount = cueCase.ViewCount,
            AverageRating = cueCase.AverageRating,
            RatingCount = cueCase.RatingCount,
            CreatedAt = cueCase.CreatedAt,
            UpdatedAt = cueCase.UpdatedAt,
            Images = cueCase.Images?.Select(img => new CueCaseImageDto
            {
                Id = img.Id,
                ImageUrl = img.ImageUrl,
                DisplayOrder = img.DisplayOrder,
                IsPrimary = img.IsPrimary,
                UploadedAt = img.UploadedAt
            }).OrderBy(img => img.DisplayOrder).ToList() ?? new List<CueCaseImageDto>(),
            IsHidden = cueCase.IsHidden,
            HiddenAt = cueCase.HiddenAt
        };
    }
}
