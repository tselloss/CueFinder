using CueFinder.Accessories.Interfaces;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Services;

/// <summary>
/// Service implementation for accessory management
/// Partial class: Dependencies and DI (this file)
/// 
/// Partial Classes:
/// - AccessoryService.cs - Constructor and dependencies
/// - AccessoryService.ReadOperations.cs - GetAll, GetById, GetUserAccessories, Search
/// - AccessoryService.WriteOperations.cs - Create, Update, Delete
/// - AccessoryService.Mapping.cs - DTO conversion
/// </summary>
public partial class AccessoryService : IAccessoryService
{
    protected readonly CueFinderDbContext _context;
    protected readonly ILogger<AccessoryService> _logger;
    protected readonly IImageService _imageService;

    public AccessoryService(CueFinderDbContext context, ILogger<AccessoryService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }
}
