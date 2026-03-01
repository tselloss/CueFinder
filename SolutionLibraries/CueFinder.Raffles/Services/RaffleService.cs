using CueFinder.Database.Context;
using CueFinder.Raffles.Interfaces;
using CueFinder.Raffles.Models;
using Microsoft.Extensions.Logging;

namespace CueFinder.Raffles.Services;

/// <summary>
/// Raffle service — split into partial classes:
/// - RaffleService.cs            : constructor / dependencies
/// - RaffleService.Read.cs       : query operations
/// - RaffleService.Write.cs      : create / update / delete / draw
/// - RaffleService.Mapping.cs    : entity → DTO mapping
/// </summary>
public partial class RaffleService : IRaffleService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<RaffleService> _logger;

    public RaffleService(CueFinderDbContext context, ILogger<RaffleService> logger)
    {
        _context = context;
        _logger = logger;
    }
}
