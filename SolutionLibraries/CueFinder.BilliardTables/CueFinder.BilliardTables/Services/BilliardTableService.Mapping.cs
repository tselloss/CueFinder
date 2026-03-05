using CueFinder.BilliardTables.Models;
using CueFinder.Database.Models;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// Service implementation for billiard table management
/// Partial class: Mapping and DTO conversion
/// </summary>
public partial class BilliardTableService
{
    private BilliardTableResponseDto MapToBilliardTableResponseDto(BilliardTable table)
    {
        return new BilliardTableResponseDto
        {
            Id = table.Id,
            Title = table.Title,
            Brand = table.Brand,
            Description = table.Description,
            Price = table.Price,
            TableSize = table.TableSize,
            TableType = table.TableType,
            PlayingSurface = table.PlayingSurface,
            FeltType = table.FeltType,
            FrameMaterial = table.FrameMaterial,
            PocketType = table.PocketType,
            Features = table.Features,
            ManufactureYear = table.ManufactureYear,
            Condition = table.Condition,
            Location = table.Location,
            IsSold = table.IsSold,
            ViewCount = table.ViewCount,
            CreatedAt = table.CreatedAt,
            UpdatedAt = table.UpdatedAt,
            SellerId = table.UserId,
            SellerName = !string.IsNullOrEmpty(table.User?.Name) ? table.User!.Name : (table.User?.Username ?? string.Empty),
            SellerEmail = table.User?.Email ?? string.Empty,
            SellerPhone = table.User?.Phone,
            SellerHidePhone = table.User?.HidePhone ?? false,
            SellerIsVerified = table.User?.IsVerified ?? false,
            AverageRating = (double)table.AverageRating,
            RatingCount = table.RatingCount,
            Images = table.Images?.Select(i => new BilliardTableImageDto
            {
                Id = i.Id,
                BilliardTableId = i.BilliardTableId,
                ImageUrl = i.ImageUrl,
                DisplayOrder = i.DisplayOrder,
                IsPrimary = i.IsPrimary,
                UploadedAt = i.CreatedAt
            }).OrderBy(i => i.DisplayOrder).ToList() ?? new List<BilliardTableImageDto>(),
            IsHidden = table.IsHidden,
            HiddenAt = table.HiddenAt
        };
    }
}
