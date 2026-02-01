using CueFinder.BilliardTables.Interfaces;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Services;

/// <summary>
/// Service implementation for billiard table management
/// Partial class: Dependencies and DI (this file)
/// 
/// Partial Classes:
/// - BilliardTableService.cs - Constructor and dependencies
/// - BilliardTableService.ReadOperations.cs - GetAll, GetById, GetUserBilliardTables, Search
/// - BilliardTableService.WriteOperations.cs - Create, Update, Delete
/// - BilliardTableService.Mapping.cs - DTO conversion
/// </summary>
public partial class BilliardTableService : IBilliardTableService
{
    protected readonly CueFinderDbContext _context;
    protected readonly ILogger<BilliardTableService> _logger;
    protected readonly IImageService _imageService;

    public BilliardTableService(CueFinderDbContext context, ILogger<BilliardTableService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }
}
