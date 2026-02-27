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
            IsHidden = accessory.IsHidden,
            HiddenAt = accessory.HiddenAt
        };
    }
}
