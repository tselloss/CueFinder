using CueFinder.CueSets.Interfaces;
using CueFinder.Database.Context;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Services;

public partial class CueSetService : ICueSetService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<CueSetService> _logger;
    private readonly IImageService _imageService;

    public CueSetService(CueFinderDbContext context, ILogger<CueSetService> logger, IImageService imageService)
    {
        _context = context;
        _logger = logger;
        _imageService = imageService;
    }
}
