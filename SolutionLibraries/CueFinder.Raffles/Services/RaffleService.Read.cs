using CueFinder.Raffles.Models;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Raffles.Services;

public partial class RaffleService
{
    public async Task<List<RaffleResponseDto>> GetAllRafflesAsync(string? status = null)
    {
        var query = _context.Raffles
            .Include(r => r.Organizer)
            .Include(r => r.Winner)
            .Include(r => r.Entries).ThenInclude(e => e.User)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            query = query.Where(r => r.Status == status);
        else
            query = query.Where(r => r.Status == "open" || r.Status == "drawn");

        var raffles = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return raffles.Select(MapToDto).ToList();
    }

    public async Task<RaffleResponseDto?> GetRaffleByIdAsync(int raffleId)
    {
        var raffle = await _context.Raffles
            .Include(r => r.Organizer)
            .Include(r => r.Winner)
            .Include(r => r.Entries).ThenInclude(e => e.User)
            .FirstOrDefaultAsync(r => r.Id == raffleId);

        return raffle == null ? null : MapToDto(raffle);
    }

    public async Task<List<RaffleResponseDto>> GetMyRafflesAsync(int userId)
    {
        var raffles = await _context.Raffles
            .Include(r => r.Organizer)
            .Include(r => r.Winner)
            .Include(r => r.Entries).ThenInclude(e => e.User)
            .Where(r => r.OrganizerId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return raffles.Select(MapToDto).ToList();
    }

    public async Task<List<RaffleResponseDto>> GetMyEntriesAsync(int userId)
    {
        var raffleIds = await _context.RaffleEntries
            .Where(e => e.UserId == userId)
            .Select(e => e.RaffleId)
            .Distinct()
            .ToListAsync();

        var raffles = await _context.Raffles
            .Include(r => r.Organizer)
            .Include(r => r.Winner)
            .Include(r => r.Entries).ThenInclude(e => e.User)
            .Where(r => raffleIds.Contains(r.Id))
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return raffles.Select(MapToDto).ToList();
    }
}
