using CueFinder.BilliardTables.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// BilliardTableService partial: Write operations (mutations)
/// - CreateBilliardTableAsync: Create a new billiard table listing
/// - UpdateBilliardTableAsync: Update an existing billiard table
/// - DeleteBilliardTableAsync: Permanently delete a billiard table and its images
/// </summary>
public partial class BilliardTableService
{
    public async Task<BilliardTableResponseDto> CreateBilliardTableAsync(CreateBilliardTableDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var table = new BilliardTable
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            TableSize = dto.TableSize,
            TableType = dto.TableType,
            PlayingSurface = dto.PlayingSurface,
            FeltType = dto.FeltType,
            FrameMaterial = dto.FrameMaterial,
            PocketType = dto.PocketType,
            Features = dto.Features,
            ManufactureYear = dto.ManufactureYear,
            Condition = dto.Condition,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsSold = false,
            ViewCount = 0
        };

        _context.BilliardTables.Add(table);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} created by user {UserId}", table.Id, userId);

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<BilliardTableResponseDto?> UpdateBilliardTableAsync(int tableId, UpdateBilliardTableDto dto, int userId)
    {
        var table = await _context.BilliardTables
            .Include(t => t.Images)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tableId);

        if (table == null)
            return null;

        // Check ownership
        if (table.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own tables");

        // Update fields
        if (dto.Title != null) table.Title = dto.Title;
        if (dto.Brand != null) table.Brand = dto.Brand;
        if (dto.Description != null) table.Description = dto.Description;
        if (dto.Price.HasValue) table.Price = dto.Price.Value;
        if (dto.TableSize != null) table.TableSize = dto.TableSize;
        if (dto.TableType != null) table.TableType = dto.TableType;
        if (dto.PlayingSurface != null) table.PlayingSurface = dto.PlayingSurface;
        if (dto.FeltType != null) table.FeltType = dto.FeltType;
        if (dto.FrameMaterial != null) table.FrameMaterial = dto.FrameMaterial;
        if (dto.PocketType != null) table.PocketType = dto.PocketType;
        if (dto.Features != null) table.Features = dto.Features;
        if (dto.ManufactureYear.HasValue) table.ManufactureYear = dto.ManufactureYear;
        if (dto.Condition != null) table.Condition = dto.Condition;
        if (dto.Location != null) table.Location = dto.Location;
        if (dto.IsSold.HasValue) table.IsSold = dto.IsSold.Value;
        if (dto.IsHidden.HasValue)
        {
            table.IsHidden = dto.IsHidden.Value;
            table.HiddenAt = dto.IsHidden.Value ? (dto.HiddenAt ?? DateTime.UtcNow) : null;
        }
        if (dto.LastUserResponseAt.HasValue) table.LastUserResponseAt = dto.LastUserResponseAt.Value;

        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} updated by user {UserId}", tableId, userId);

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<bool> MarkAsSoldAsync(int tableId, int userId)
    {
        var table = await _context.BilliardTables.FindAsync(tableId);
        if (table == null) return false;
        if (table.UserId != userId)
            throw new UnauthorizedAccessException("You can only mark your own tables as sold");

        table.IsSold = true;
        table.SoldDate = DateTime.UtcNow;
        table.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        _logger.LogInformation("Billiard table {TableId} marked as sold by user {UserId}", tableId, userId);
        return true;
    }

    public async Task<bool> DeleteBilliardTableAsync(int tableId, int userId, bool isAdmin = false)
    {
        var table = await _context.BilliardTables.FindAsync(tableId);
        if (table == null)
        {
            _logger.LogWarning("Billiard table {TableId} not found for deletion by user {UserId}", tableId, userId);
            return false;
        }

        // Check ownership or admin
        if (table.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own tables");

        // Delete all associated images first
        await _imageService.DeleteBilliardTableImagesInternalAsync(tableId);

        _context.BilliardTables.Remove(table);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} deleted by user {UserId}", tableId, userId);
        return true;
    }
}
