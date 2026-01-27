using CueFinder.Cues.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Services;

/// <summary>
/// CueService partial: Write operations (mutations)
/// - CreateCueAsync: Create a new cue listing
/// - UpdateCueAsync: Update an existing cue
/// - DeleteCueAsync: Soft-delete a cue by marking as sold
/// </summary>
public partial class CueService
{
    public async Task<CueResponseDto> CreateCueAsync(CreateCueDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var cueType = string.IsNullOrWhiteSpace(dto.CueType)
            ? "playing"
            : dto.CueType.Trim().ToLowerInvariant();

        var cue = new Cue
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            CueType = cueType,
            ShaftMaterial = dto.Material ?? string.Empty,
            Weight = dto.Weight,
            Length = dto.Length,
            TipSize = dto.TipSize,
            Location = dto.Location ?? string.Empty,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsSold = false,
            ViewCount = 0
        };

        _context.Cues.Add(cue);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} created by user {UserId}", cue.Id, userId);

        return MapToCueResponseDto(cue);
    }

    public async Task<CueResponseDto?> UpdateCueAsync(int cueId, UpdateCueDto dto, int userId)
    {
        var cue = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == cueId);

        if (cue == null)
            return null;

        // Check ownership
        if (cue.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own cues");

        // Update fields
        if (dto.Title != null) cue.Title = dto.Title;
        if (dto.Brand != null) cue.Brand = dto.Brand;
        if (dto.Description != null) cue.Description = dto.Description;
        if (dto.Price.HasValue) cue.Price = dto.Price.Value;
        if (dto.Condition != null) cue.Condition = dto.Condition;
        if (dto.CueType != null) cue.CueType = dto.CueType.Trim().ToLowerInvariant();
        if (dto.Material != null) cue.ShaftMaterial = dto.Material;
        if (dto.Weight.HasValue) cue.Weight = dto.Weight;
        if (dto.Length.HasValue) cue.Length = dto.Length;
        if (dto.TipSize.HasValue) cue.TipSize = dto.TipSize;
        if (dto.Location != null) cue.Location = dto.Location;
        if (dto.IsSold.HasValue) cue.IsSold = dto.IsSold.Value;

        cue.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} updated by user {UserId}", cueId, userId);

        return MapToCueResponseDto(cue);
    }

    public async Task<bool> DeleteCueAsync(int cueId, int userId, bool isAdmin = false)
    {
        var cue = await _context.Cues.FindAsync(cueId);

        if (cue == null)
            return false;

        // Check ownership or admin
        if (cue.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own cues");

        // Delete all associated images first
        await _imageService.DeleteCueImagesInternalAsync(cueId);

        // Soft delete by marking as sold
        cue.IsSold = true;
        cue.SoldDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} deleted by user {UserId}", cueId, userId);

        return true;
    }
}
