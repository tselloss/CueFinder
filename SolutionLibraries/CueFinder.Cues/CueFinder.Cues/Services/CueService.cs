using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Extensions.Email;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Cues.Services;

/// <summary>
/// Service implementation for cue management
/// Partial class: Dependencies and DI (this file)
/// 
/// Partial Classes:
/// - CueService.cs - Constructor and dependencies
/// - CueService.ReadOperations.cs - GetAll, GetById, GetUserCues, Search
/// - CueService.WriteOperations.cs - Create, Update, Delete
/// - CueService.Mapping.cs - DTO conversion
/// </summary>
public partial class CueService : ICueService
{
    protected readonly CueFinderDbContext _context;
    protected readonly ILogger<CueService> _logger;
    protected readonly CueFinder.Extensions.Images.IImageService _imageService;
    protected readonly IEmailService _emailService;

    public CueService(CueFinderDbContext context, ILogger<CueService> logger, CueFinder.Extensions.Images.IImageService imageService, IEmailService emailService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
        _emailService = emailService;
    }

    // Implements ICueService.GetUserCuesAsync(int)
    public async Task<List<CueResponseDto>> GetUserCuesAsync(int userId)
    {
        var cues = await _context.Cues
            .Include(c => c.Images)
            .Include(c => c.Ratings)
            .Include(c => c.User)
            .AsSplitQuery()
            .Where(c => c.UserId == userId && !c.IsSold)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
        return cues.Select(MapToCueResponseDto).ToList();
    }

    // Implements ICueService.DeleteCueAsync(int, int, bool)
    public async Task<bool> DeleteCueAsync(int cueId, int userId, bool isAdmin = false)
    {
        var cue = await _context.Cues.FirstOrDefaultAsync(c => c.Id == cueId);
        if (cue == null)
            return false;
        if (!isAdmin && cue.UserId != userId)
            throw new UnauthorizedAccessException("You can only delete your own cues unless you are admin.");
        await _imageService.DeleteCueImagesInternalAsync(cueId);
        _context.Cues.Remove(cue);
        await _context.SaveChangesAsync();
        return true;
    }
}

