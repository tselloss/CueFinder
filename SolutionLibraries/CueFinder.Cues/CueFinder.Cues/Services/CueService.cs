using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Extensions.Email;
using Microsoft.Extensions.Logging;

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

}

