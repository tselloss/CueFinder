using CueFinder.CueCases.Interfaces;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Services;

/// <summary>
/// Service implementation for cue case management
/// Partial class: Dependencies and DI (this file)
/// 
/// Partial Classes:
/// - CueCaseService.cs - Constructor and dependencies
/// - CueCaseService.ReadOperations.cs - GetAll, GetById, GetUserCueCases, Search
/// - CueCaseService.WriteOperations.cs - Create, Update, Delete
/// - CueCaseService.Mapping.cs - DTO conversion
/// </summary>
public partial class CueCaseService : ICueCaseService
{
    protected readonly CueFinderDbContext _context;
    protected readonly ILogger<CueCaseService> _logger;
    protected readonly IImageService _imageService;

    public CueCaseService(CueFinderDbContext context, ILogger<CueCaseService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }
}
