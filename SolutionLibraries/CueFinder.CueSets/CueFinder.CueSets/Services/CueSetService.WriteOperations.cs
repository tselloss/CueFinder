using CueFinder.CueSets.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Services;

public partial class CueSetService
{
    public async Task<CueSetResponseDto> CreateCueSetAsync(CreateCueSetDto dto, int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
            throw new InvalidOperationException("User not found");

        var set = new CueSet
        {
            Title = dto.Title,
            Brand = dto.Brand,
            Description = dto.Description,
            Price = dto.Price,
            Condition = dto.Condition,
            Location = dto.Location ?? string.Empty,
            IncludesPlayingCue = dto.IncludesPlayingCue,
            IncludesBreakCue = dto.IncludesBreakCue,
            IncludesJumpCue = dto.IncludesJumpCue,
            IncludesCase = dto.IncludesCase,
            PlayingCueWeight = dto.PlayingCueWeight,
            PlayingCueLength = dto.PlayingCueLength,
            PlayingCueTipSize = dto.PlayingCueTipSize,
            PlayingCueShaftMaterial = dto.PlayingCueShaftMaterial,
            PlayingCueButtMaterial = dto.PlayingCueButtMaterial,
            BreakCueWeight = dto.BreakCueWeight,
            BreakCueLength = dto.BreakCueLength,
            BreakCueTipSize = dto.BreakCueTipSize,
            BreakCueShaftMaterial = dto.BreakCueShaftMaterial,
            BreakCueButtMaterial = dto.BreakCueButtMaterial,
            JumpCueWeight = dto.JumpCueWeight,
            JumpCueLength = dto.JumpCueLength,
            JumpCueTipSize = dto.JumpCueTipSize,
            JumpCueShaftMaterial = dto.JumpCueShaftMaterial,
            JumpCueButtMaterial = dto.JumpCueButtMaterial,
            CaseCapacity = dto.CaseCapacity,
            CaseOpening = dto.CaseOpening,
            CaseType = dto.CaseType,
            CaseColor = dto.CaseColor,
            CaseMaterial = dto.CaseMaterial,
            Features = dto.Features,
            UserId = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.CueSets.Add(set);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created new cue set listing {CueSetId} by user {UserId}", set.Id, userId);

        var created = await _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .FirstAsync(s => s.Id == set.Id);

        return MapToCueSetResponseDto(created);
    }

    public async Task<CueSetResponseDto?> UpdateCueSetAsync(int cueSetId, UpdateCueSetDto dto, int userId)
    {
        var set = await _context.CueSets
            .Include(s => s.Images)
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == cueSetId);

        if (set == null)
            return null;

        if (set.UserId != userId)
            throw new UnauthorizedAccessException("You can only update your own listings");

        if (!string.IsNullOrEmpty(dto.Title)) set.Title = dto.Title;
        if (!string.IsNullOrEmpty(dto.Brand)) set.Brand = dto.Brand;
        if (!string.IsNullOrEmpty(dto.Description)) set.Description = dto.Description;
        if (dto.Price.HasValue) set.Price = dto.Price.Value;
        if (!string.IsNullOrEmpty(dto.Condition)) set.Condition = dto.Condition;
        if (dto.Location != null) set.Location = dto.Location;
        if (dto.Features != null) set.Features = dto.Features;

        if (dto.IncludesPlayingCue.HasValue) set.IncludesPlayingCue = dto.IncludesPlayingCue.Value;
        if (dto.IncludesBreakCue.HasValue) set.IncludesBreakCue = dto.IncludesBreakCue.Value;
        if (dto.IncludesJumpCue.HasValue) set.IncludesJumpCue = dto.IncludesJumpCue.Value;
        if (dto.IncludesCase.HasValue) set.IncludesCase = dto.IncludesCase.Value;

        if (dto.PlayingCueWeight.HasValue) set.PlayingCueWeight = dto.PlayingCueWeight;
        if (dto.PlayingCueLength.HasValue) set.PlayingCueLength = dto.PlayingCueLength;
        if (dto.PlayingCueTipSize.HasValue) set.PlayingCueTipSize = dto.PlayingCueTipSize;
        if (dto.PlayingCueShaftMaterial != null) set.PlayingCueShaftMaterial = dto.PlayingCueShaftMaterial;
        if (dto.PlayingCueButtMaterial != null) set.PlayingCueButtMaterial = dto.PlayingCueButtMaterial;

        if (dto.BreakCueWeight.HasValue) set.BreakCueWeight = dto.BreakCueWeight;
        if (dto.BreakCueLength.HasValue) set.BreakCueLength = dto.BreakCueLength;
        if (dto.BreakCueTipSize.HasValue) set.BreakCueTipSize = dto.BreakCueTipSize;
        if (dto.BreakCueShaftMaterial != null) set.BreakCueShaftMaterial = dto.BreakCueShaftMaterial;
        if (dto.BreakCueButtMaterial != null) set.BreakCueButtMaterial = dto.BreakCueButtMaterial;

        if (dto.JumpCueWeight.HasValue) set.JumpCueWeight = dto.JumpCueWeight;
        if (dto.JumpCueLength.HasValue) set.JumpCueLength = dto.JumpCueLength;
        if (dto.JumpCueTipSize.HasValue) set.JumpCueTipSize = dto.JumpCueTipSize;
        if (dto.JumpCueShaftMaterial != null) set.JumpCueShaftMaterial = dto.JumpCueShaftMaterial;
        if (dto.JumpCueButtMaterial != null) set.JumpCueButtMaterial = dto.JumpCueButtMaterial;

        if (dto.CaseCapacity != null) set.CaseCapacity = dto.CaseCapacity;
        if (dto.CaseOpening != null) set.CaseOpening = dto.CaseOpening;
        if (dto.CaseType != null) set.CaseType = dto.CaseType;
        if (dto.CaseColor != null) set.CaseColor = dto.CaseColor;
        if (dto.CaseMaterial != null) set.CaseMaterial = dto.CaseMaterial;

        if (dto.IsSold.HasValue)
        {
            set.IsSold = dto.IsSold.Value;
            if (dto.IsSold.Value && !set.SoldDate.HasValue)
                set.SoldDate = DateTime.UtcNow;
        }

        if (dto.IsHidden.HasValue)
        {
            set.IsHidden = dto.IsHidden.Value;
            set.HiddenAt = dto.IsHidden.Value ? (dto.HiddenAt ?? DateTime.UtcNow) : null;
        }

        if (dto.LastUserResponseAt.HasValue)
            set.LastUserResponseAt = dto.LastUserResponseAt.Value;

        set.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated cue set listing {CueSetId}", cueSetId);
        return MapToCueSetResponseDto(set);
    }

    public async Task<bool> DeleteCueSetAsync(int cueSetId, int userId, bool isAdmin = false)
    {
        var set = await _context.CueSets
            .Include(s => s.Images)
            .FirstOrDefaultAsync(s => s.Id == cueSetId);

        if (set == null)
            return false;

        if (set.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own listings");

        await _imageService.DeleteCueSetImagesInternalAsync(cueSetId);

        _context.CueSets.Remove(set);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted cue set listing {CueSetId} by user {UserId}", cueSetId, userId);
        return true;
    }
}
