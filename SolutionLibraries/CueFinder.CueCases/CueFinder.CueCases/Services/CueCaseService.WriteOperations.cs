using CueFinder.CueCases.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Services;

/// <summary>
/// CueCaseService partial: Write operations (mutations)
/// - CreateCueCaseAsync: Create a new cue case listing
/// - UpdateCueCaseAsync: Update an existing cue case
/// - DeleteCueCaseAsync: Delete a cue case permanently
/// </summary>
public partial class CueCaseService
{
    /// <summary>
    /// Process old cue case listings: prompt, hide, or delete based on inactivity (new business rules).
    /// </summary>
    public async Task ProcessOldListingsAsync()
    {
        var now = DateTime.UtcNow;
        var listings = await _context.CueCases.ToListAsync();
        foreach (var listing in listings)
        {
            if (listing.IsSold)
                continue;

            // If hidden for over 6 months, delete
            if (listing.IsHidden && listing.HiddenAt.HasValue && (now - listing.HiddenAt.Value).TotalDays > 180)
            {
                await _imageService.DeleteCueCaseImagesInternalAsync(listing.Id);
                _context.CueCases.Remove(listing);
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

    public async Task<CueCaseResponseDto> CreateCueCaseAsync(CreateCueCaseDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var cueCase = new CueCase
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            CaseCapacity = dto.CaseCapacity,
            CaseOpening = dto.CaseOpening,
            CaseType = dto.CaseType,
            Color = dto.Color,
            CaseMaterial = dto.CaseMaterial,
            OuterDimensions = dto.OuterDimensions,
            PocketSpace = dto.PocketSpace,
            HandleExtensionSpace = dto.HandleExtensionSpace,
            CaseWeight = dto.CaseWeight,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CueCases.Add(cueCase);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new cue case listing {CueCaseId} by user {UserId}", cueCase.Id, userId);

        var created = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .FirstAsync(c => c.Id == cueCase.Id);

        return MapToCueCaseResponseDto(created);
    }

    public async Task<CueCaseResponseDto?> UpdateCueCaseAsync(int cueCaseId, UpdateCueCaseDto dto, int userId)
    {
        var cueCase = await _context.CueCases
            .Include(c => c.Images)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == cueCaseId);

        if (cueCase == null)
            return null;

        // Verify ownership
        if (cueCase.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own listings");

        // Update fields if provided
        if (!string.IsNullOrEmpty(dto.Title))
            cueCase.Title = dto.Title;

        if (!string.IsNullOrEmpty(dto.Brand))
            cueCase.Brand = dto.Brand;

        if (!string.IsNullOrEmpty(dto.Description))
            cueCase.Description = dto.Description;

        if (dto.Price.HasValue)
            cueCase.Price = dto.Price.Value;

        if (!string.IsNullOrEmpty(dto.Condition))
            cueCase.Condition = dto.Condition;

        if (!string.IsNullOrEmpty(dto.CaseCapacity))
            cueCase.CaseCapacity = dto.CaseCapacity;

        if (!string.IsNullOrEmpty(dto.CaseOpening))
            cueCase.CaseOpening = dto.CaseOpening;

        if (!string.IsNullOrEmpty(dto.CaseType))
            cueCase.CaseType = dto.CaseType;

        if (dto.Color != null)
            cueCase.Color = dto.Color;

        if (dto.IsHidden.HasValue)
        {
            cueCase.IsHidden = dto.IsHidden.Value;
            cueCase.HiddenAt = dto.IsHidden.Value ? (dto.HiddenAt ?? DateTime.UtcNow) : null;
        }
        if (dto.LastUserResponseAt.HasValue) cueCase.LastUserResponseAt = dto.LastUserResponseAt.Value;

        if (dto.CaseMaterial != null)
            cueCase.CaseMaterial = dto.CaseMaterial;

        if (dto.OuterDimensions != null)
            cueCase.OuterDimensions = dto.OuterDimensions;

        if (dto.PocketSpace != null)
            cueCase.PocketSpace = dto.PocketSpace;

        if (dto.HandleExtensionSpace != null)
            cueCase.HandleExtensionSpace = dto.HandleExtensionSpace;

        if (dto.CaseWeight != null)
            cueCase.CaseWeight = dto.CaseWeight;

        if (dto.Location != null)
            cueCase.Location = dto.Location;

        if (dto.IsSold.HasValue)
        {
            cueCase.IsSold = dto.IsSold.Value;
            if (dto.IsSold.Value && !cueCase.SoldDate.HasValue)
                cueCase.SoldDate = DateTime.UtcNow;
        }

        cueCase.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated cue case listing {CueCaseId}", cueCaseId);

        return MapToCueCaseResponseDto(cueCase);
    }

    public async Task<bool> DeleteCueCaseAsync(int cueCaseId, int userId, bool isAdmin = false)
    {
        var cueCase = await _context.CueCases
            .Include(c => c.Images)
            .FirstOrDefaultAsync(c => c.Id == cueCaseId);

        if (cueCase == null)
            return false;

        // Verify ownership or admin
        if (cueCase.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own listings");

        // Delete all associated images first
        await _imageService.DeleteCueCaseImagesInternalAsync(cueCaseId);

        _context.CueCases.Remove(cueCase);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted cue case listing {CueCaseId} by user {UserId}", cueCaseId, userId);

        return true;
    }
}
