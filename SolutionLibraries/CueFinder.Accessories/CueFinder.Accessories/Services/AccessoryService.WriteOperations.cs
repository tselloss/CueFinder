using CueFinder.Accessories.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Services;

/// <summary>
/// AccessoryService partial: Write operations (mutations)
/// - CreateAccessoryAsync: Create a new accessory listing
/// - UpdateAccessoryAsync: Update an existing accessory
/// - DeleteAccessoryAsync: Soft-delete an accessory by marking as sold
/// </summary>
public partial class AccessoryService
{

    /// <summary>
    /// Process old accessory listings: prompt, hide, or delete based on inactivity (new business rules).
    /// </summary>
    public async Task ProcessOldListingsAsync()
    {
        var now = DateTime.UtcNow;
        var listings = await _context.Accessories.ToListAsync();
        foreach (var listing in listings)
        {
            if (listing.IsSold)
                continue;

            // If hidden for over 6 months, delete
            if (listing.IsHidden && listing.HiddenAt.HasValue && (now - listing.HiddenAt.Value).TotalDays > 180)
            {
                await _imageService.DeleteAccessoryImagesInternalAsync(listing.Id);
                _context.Accessories.Remove(listing);
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
    }

    public async Task<AccessoryResponseDto> CreateAccessoryAsync(CreateAccessoryDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var accessory = new Accessory
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            AccessoryType = dto.AccessoryType,
            Material = dto.Material ?? string.Empty,
            Size = dto.Size ?? string.Empty,
            Color = dto.Color ?? string.Empty,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsSold = false,
            ViewCount = 0
        };

        _context.Accessories.Add(accessory);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Accessory {AccessoryId} created by user {UserId}", accessory.Id, userId);

        return MapToAccessoryResponseDto(accessory);
    }

    public async Task<AccessoryResponseDto?> UpdateAccessoryAsync(int accessoryId, UpdateAccessoryDto dto, int userId)
    {
        var accessory = await _context.Accessories
            .Include(a => a.Images)
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == accessoryId);

        if (accessory == null)
            return null;

        // Check ownership
        if (accessory.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own accessories");

        // Update fields
        if (dto.Title != null) accessory.Title = dto.Title;
        if (dto.Brand != null) accessory.Brand = dto.Brand;
        if (dto.Description != null) accessory.Description = dto.Description;
        if (dto.Price.HasValue) accessory.Price = dto.Price.Value;
        if (dto.Condition != null) accessory.Condition = dto.Condition;
        if (dto.AccessoryType != null) accessory.AccessoryType = dto.AccessoryType;
        if (dto.Material != null) accessory.Material = dto.Material;
        if (dto.Size != null) accessory.Size = dto.Size;
        if (dto.Color != null) accessory.Color = dto.Color;
        if (dto.Location != null) accessory.Location = dto.Location;
        if (dto.IsSold.HasValue) accessory.IsSold = dto.IsSold.Value;
        // Reactivation logic removed: UpdateAccessoryDto does not contain IsHidden
        
        accessory.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Accessory {AccessoryId} updated by user {UserId}", accessoryId, userId);

        return MapToAccessoryResponseDto(accessory);
    }

    public async Task<bool> DeleteAccessoryAsync(int accessoryId, int userId, bool isAdmin = false)
    {
        var accessory = await _context.Accessories.FindAsync(accessoryId);

        if (accessory == null)
            return false;

        // Check ownership or admin
        if (accessory.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own accessories");

        // Delete all associated images first
        await _imageService.DeleteAccessoryImagesInternalAsync(accessoryId);

        // Soft delete by marking as sold
        accessory.IsSold = true;
        accessory.SoldDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Accessory {AccessoryId} deleted by user {UserId}", accessoryId, userId);

        return true;
    }
}
