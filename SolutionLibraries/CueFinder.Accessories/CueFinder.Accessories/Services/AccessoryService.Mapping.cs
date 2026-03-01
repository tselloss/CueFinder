using CueFinder.Accessories.Models;
using CueFinder.Database.Models;

namespace CueFinder.Accessories.Services;

/// <summary>
/// Service implementation for accessory management
/// Partial class: Mapping and DTO conversion
/// </summary>
public partial class AccessoryService
{
    private AccessoryResponseDto MapToAccessoryResponseDto(Accessory accessory)
    {
        return new AccessoryResponseDto
        {
            Id = accessory.Id,
            Title = accessory.Title,
            Brand = accessory.Brand,
            Description = accessory.Description,
            Price = accessory.Price,
            Condition = accessory.Condition,
            AccessoryType = accessory.AccessoryType,
            Material = accessory.Material,
            Size = accessory.Size,
            Color = accessory.Color,
            Location = accessory.Location,
            IsSold = accessory.IsSold,
            ViewCount = accessory.ViewCount,
            CreatedAt = accessory.CreatedAt,
            UpdatedAt = accessory.UpdatedAt,
            SellerId = accessory.UserId,
            SellerName = accessory.User?.Name ?? string.Empty,
            SellerEmail = accessory.User?.Email ?? string.Empty,
            SellerPhone = accessory.User?.Phone,
            SellerHidePhone = accessory.User?.HidePhone ?? false,
            AverageRating = (double)accessory.AverageRating,
            RatingCount = accessory.RatingCount,
            Images = accessory.Images?.Select(i => new AccessoryImageDto
            {
                Id = i.Id,
                AccessoryId = i.AccessoryId,
                ImageUrl = i.ImageUrl,
                AltText = i.AltText,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.UploadedAt
            }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<AccessoryImageDto>(),
            IsHidden = accessory.IsHidden,
            HiddenAt = accessory.HiddenAt
        };
    }
}
