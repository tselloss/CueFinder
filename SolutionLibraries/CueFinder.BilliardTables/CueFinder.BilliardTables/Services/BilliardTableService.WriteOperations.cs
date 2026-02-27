using CueFinder.BilliardTables.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// BilliardTableService partial: Write operations (mutations)
/// - CreateBilliardTableAsync: Create a new billiard table listing
/// - UpdateBilliardTableAsync: Update an existing billiard table
/// - DeleteBilliardTableAsync: Soft-delete a billiard table by marking as sold
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
        // Reactivation: if isHidden is being set to false, reset prompt timers
        if (dto.IsHidden.HasValue && dto.IsHidden.Value == false && table.IsHidden)
        {
            table.IsHidden = false;
            table.HiddenAt = null;
            table.LastPromptedAt = null;
            table.LastUserResponseAt = null;
        }
        
        table.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Billiard table {TableId} updated by user {UserId}", tableId, userId);

        return MapToBilliardTableResponseDto(table);
    }

    public async Task<bool> DeleteBilliardTableAsync(int tableId, int userId, bool isAdmin = false)
    {
        var table = await _context.BilliardTables.FindAsync(tableId);

        if (table == null)
            return false;

        // Check ownership or admin
        if (table.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own tables");

        // Delete all associated images first
        await _imageService.DeleteBilliardTableImagesInternalAsync(tableId);

        // Soft delete by marking as sold
        table.IsSold = true;
        var now = DateTime.UtcNow;
        var listings = await _context.BilliardTables.ToListAsync();
        foreach (var listing in listings)
        {
            if (listing.IsSold)
                continue;

            // If hidden for over 6 months, delete
            if (listing.IsHidden && listing.HiddenAt.HasValue && (now - listing.HiddenAt.Value).TotalDays > 180)
            {
                await _imageService.DeleteBilliardTableImagesInternalAsync(listing.Id);
                _context.BilliardTables.Remove(listing);
                continue;
            }

            if (!listing.IsHidden)
            {
                // First prompt: 2 months after creation
                var firstPromptDue = (now - listing.CreatedAt).TotalDays >= 60 && !listing.LastPromptedAt.HasValue;
                // Re-prompt: 2 months after last prompt if user pressed 'active'
                var rePromptDue = listing.LastPromptedAt.HasValue && listing.LastUserResponseAt.HasValue && listing.LastUserResponseAt >= listing.LastPromptedAt && (now - listing.LastPromptedAt.Value).TotalDays >= 60;

                if (firstPromptDue || rePromptDue)
                {
                    // TODO: Send prompt to user (notification/email/etc.)
                    listing.LastPromptedAt = now;
                }

                // If last prompt was over 2 months ago and no user response since, hide
                if (listing.LastPromptedAt.HasValue &&
                    (!listing.LastUserResponseAt.HasValue || listing.LastUserResponseAt < listing.LastPromptedAt) &&
                    (now - listing.LastPromptedAt.Value).TotalDays >= 60)
                {
                    listing.IsHidden = true;
                    listing.HiddenAt = now;
                }
            }
        }
        await _context.SaveChangesAsync();
