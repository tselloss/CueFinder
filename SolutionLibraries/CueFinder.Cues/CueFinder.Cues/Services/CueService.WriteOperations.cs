using CueFinder.Cues.Models;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Services;

/// <summary>
/// CueService partial: Write operations (mutations)
/// - CreateCueAsync: Create a new cue listing
/// - UpdateCueAsync: Update an existing cue
/// - DeleteCueAsync: Permanently delete a cue and its images
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

        // Send email notification to admin users
        try
        {
            await SendCueCreatedEmailToAdminsAsync(cue, user);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send cue created email notification for cue {CueId}", cue.Id);
            // Don't throw - email failure shouldn't prevent cue creation
        }

        return MapToCueResponseDto(cue);
    }

    /// <summary>
    /// Send email notification to all admin users when a new cue is created
    /// </summary>
    private async Task SendCueCreatedEmailToAdminsAsync(Cue cue, User seller)
    {
        // Get all admin users with email
        var adminUsers = await _context.Users
            .Where(u => u.Role == "admin" && !string.IsNullOrWhiteSpace(u.Email))
            .ToListAsync();

        if (!adminUsers.Any())
        {
            _logger.LogWarning("No admin users found with email addresses to notify about cue {CueId}", cue.Id);
            return;
        }

        var adminEmails = adminUsers.Select(u => u.Email).ToList();
        
        var subject = $"New Cue Listing: {cue.Title}";
        var htmlBody = BuildCueCreatedEmailBody(cue, seller);

        await _emailService.SendBatchAsync(adminEmails, subject, htmlBody, isHtml: true);

        _logger.LogInformation("Sent cue created notification email to {Count} admin users for cue {CueId}", 
            adminUsers.Count, cue.Id);
    }

    /// <summary>
    /// Build HTML email body for cue creation notification
    /// </summary>
    private string BuildCueCreatedEmailBody(Cue cue, User seller)
    {
        var cueLink = $"{Environment.GetEnvironmentVariable("APP_URL") ?? "http://localhost:3000"}/cues/{cue.Id}";
        
        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #1a5f3b; color: white; padding: 20px; border-radius: 5px; margin-bottom: 20px; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 5px; }}
        .field {{ margin: 15px 0; }}
        .label {{ font-weight: bold; color: #1a5f3b; }}
        .value {{ margin-top: 5px; }}
        .button {{ display: inline-block; background-color: #1a5f3b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; }}
        .footer {{ margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h2>New Cue Listing Created</h2>
        </div>
        
        <div class=""content"">
            <div class=""field"">
                <div class=""label"">Title:</div>
                <div class=""value"">{cue.Title}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Brand:</div>
                <div class=""value"">{cue.Brand}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Price:</div>
                <div class=""value"">${cue.Price:N2}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Condition:</div>
                <div class=""value"">{cue.Condition}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Type:</div>
                <div class=""value"">{cue.CueType}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Location:</div>
                <div class=""value"">{cue.Location}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Description:</div>
                <div class=""value"">{cue.Description}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Seller:</div>
                <div class=""value"">{seller.Name} ({seller.Username})</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Seller Email:</div>
                <div class=""value"">{seller.Email}</div>
            </div>
            
            <div class=""field"">
                <div class=""label"">Created:</div>
                <div class=""value"">{cue.CreatedAt:yyyy-MM-dd HH:mm:ss} UTC</div>
            </div>
            
            <a href=""{cueLink}"" class=""button"">View Cue Listing</a>
        </div>
        
        <div class=""footer"">
            <p>This is an automated notification from CueFinder Admin System</p>
        </div>
    </div>
</body>
</html>";
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
        if (dto.IsHidden.HasValue)
        {
            cue.IsHidden = dto.IsHidden.Value;
            cue.HiddenAt = dto.IsHidden.Value ? (dto.HiddenAt ?? DateTime.UtcNow) : null;
        }
        if (dto.LastUserResponseAt.HasValue) cue.LastUserResponseAt = dto.LastUserResponseAt.Value;

        cue.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} updated by user {UserId}", cueId, userId);

        return MapToCueResponseDto(cue);
    }

    public async Task<bool> DeleteCueAsync(int cueId, int userId, bool isAdmin = false)
    {
        var cue = await _context.Cues
            .Include(c => c.Images)
            .FirstOrDefaultAsync(c => c.Id == cueId);

        if (cue == null)
            return false;

        if (cue.UserId != userId && !isAdmin)
            throw new UnauthorizedAccessException("You can only delete your own cues");

        await _imageService.DeleteCueImagesInternalAsync(cueId);

        _context.Cues.Remove(cue);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Cue {CueId} deleted by user {UserId}", cueId, userId);

        return true;
    }
}
