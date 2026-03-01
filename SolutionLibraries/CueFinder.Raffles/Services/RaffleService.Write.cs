using CueFinder.Database.Models;
using CueFinder.Raffles.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Raffles.Services;

public partial class RaffleService
{
    public async Task<RaffleResponseDto> CreateRaffleAsync(CreateRaffleDto dto, int organizerId)
    {
        var user = await _context.Users.FindAsync(organizerId)
            ?? throw new InvalidOperationException("User not found");

        var raffle = new Raffle
        {
            OrganizerId = organizerId,
            Title = dto.Title,
            Description = dto.Description,
            ItemImageUrl = dto.ItemImageUrl,
            TotalSpots = dto.TotalSpots,
            PricePerSpot = dto.PricePerSpot,
            EndsAt = dto.EndsAt,
            AcceptPayPal = dto.AcceptPayPal,
            AcceptRevolut = dto.AcceptRevolut,
            AcceptBankTransfer = dto.AcceptBankTransfer,
            AcceptViva = dto.AcceptViva,
            AcceptIris = dto.AcceptIris,
            AcceptDM = dto.AcceptDM,
            PaymentDetails = dto.PaymentDetails,
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };

        _context.Raffles.Add(raffle);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Raffle {RaffleId} created by user {UserId}", raffle.Id, organizerId);

        return (await GetRaffleByIdAsync(raffle.Id))!;
    }

    public async Task<RaffleResponseDto?> UpdateRaffleAsync(int raffleId, CreateRaffleDto dto, int requestingUserId)
    {
        var raffle = await _context.Raffles.FindAsync(raffleId);
        if (raffle == null) return null;

        if (raffle.OrganizerId != requestingUserId)
            throw new UnauthorizedAccessException("Only the organizer can edit this raffle");

        if (raffle.Status != "open")
            throw new InvalidOperationException("Only open raffles can be edited");

        raffle.Title = dto.Title;
        raffle.Description = dto.Description;
        raffle.ItemImageUrl = dto.ItemImageUrl;
        raffle.TotalSpots = dto.TotalSpots;
        raffle.PricePerSpot = dto.PricePerSpot;
        raffle.EndsAt = dto.EndsAt;
        raffle.AcceptPayPal = dto.AcceptPayPal;
        raffle.AcceptRevolut = dto.AcceptRevolut;
        raffle.AcceptBankTransfer = dto.AcceptBankTransfer;
        raffle.AcceptViva = dto.AcceptViva;
        raffle.AcceptIris = dto.AcceptIris;
        raffle.AcceptDM = dto.AcceptDM;
        raffle.PaymentDetails = dto.PaymentDetails;

        await _context.SaveChangesAsync();
        return await GetRaffleByIdAsync(raffleId);
    }

    public async Task<bool> DeleteRaffleAsync(int raffleId, int requestingUserId, bool isAdmin)
    {
        var raffle = await _context.Raffles.FindAsync(raffleId);
        if (raffle == null) return false;

        if (raffle.OrganizerId != requestingUserId && !isAdmin)
            throw new UnauthorizedAccessException("Only the organizer or an admin can delete this raffle");

        raffle.Status = "cancelled";
        await _context.SaveChangesAsync();

        _logger.LogInformation("Raffle {RaffleId} cancelled by user {UserId}", raffleId, requestingUserId);
        return true;
    }

    public async Task<RaffleEntryResponseDto> EnterRaffleAsync(int raffleId, EnterRaffleDto dto, int userId)
    {
        var raffle = await _context.Raffles
            .Include(r => r.Entries)
            .FirstOrDefaultAsync(r => r.Id == raffleId)
            ?? throw new InvalidOperationException("Raffle not found");

        if (raffle.Status != "open")
            throw new InvalidOperationException("This raffle is no longer accepting entries");

        if (raffle.EndsAt < DateTime.UtcNow)
            throw new InvalidOperationException("This raffle has already ended");

        if (dto.SpotNumber < 1 || dto.SpotNumber > raffle.TotalSpots)
            throw new InvalidOperationException($"Spot number must be between 1 and {raffle.TotalSpots}");

        var spotTaken = raffle.Entries.Any(e => e.SpotNumber == dto.SpotNumber);
        if (spotTaken)
            throw new InvalidOperationException($"Spot #{dto.SpotNumber} is already taken");

        var entry = new RaffleEntry
        {
            RaffleId = raffleId,
            UserId = userId,
            SpotNumber = dto.SpotNumber,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.RaffleEntries.Add(entry);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} claimed spot #{Spot} in raffle {RaffleId}", userId, dto.SpotNumber, raffleId);

        await _context.Entry(entry).Reference(e => e.User).LoadAsync();
        return MapEntryToDto(entry);
    }

    public async Task<RaffleEntryResponseDto?> VerifyEntryAsync(int raffleId, int entryId, VerifyEntryDto dto, int requestingUserId)
    {
        var raffle = await _context.Raffles.FindAsync(raffleId);
        if (raffle == null) return null;

        if (raffle.OrganizerId != requestingUserId)
            throw new UnauthorizedAccessException("Only the organizer can verify payments");

        var entry = await _context.RaffleEntries
            .Include(e => e.User)
            .FirstOrDefaultAsync(e => e.Id == entryId && e.RaffleId == raffleId);

        if (entry == null) return null;

        entry.Status = "paid";
        entry.PaymentMethod = dto.PaymentMethod;
        entry.PaymentReference = dto.PaymentReference;
        entry.PaidAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Entry {EntryId} in raffle {RaffleId} marked as paid", entryId, raffleId);
        return MapEntryToDto(entry);
    }

    public async Task<RaffleResponseDto?> DrawWinnerAsync(int raffleId, int requestingUserId)
    {
        var raffle = await _context.Raffles
            .Include(r => r.Entries).ThenInclude(e => e.User)
            .Include(r => r.Organizer)
            .FirstOrDefaultAsync(r => r.Id == raffleId);

        if (raffle == null) return null;

        if (raffle.OrganizerId != requestingUserId)
            throw new UnauthorizedAccessException("Only the organizer can draw the winner");

        if (raffle.Status != "open")
            throw new InvalidOperationException("Only open raffles can be drawn");

        var paidEntries = raffle.Entries.Where(e => e.Status == "paid").ToList();
        if (paidEntries.Count == 0)
            throw new InvalidOperationException("No paid entries to draw from");

        // Cryptographically secure random selection
        var winnerIndex = System.Security.Cryptography.RandomNumberGenerator.GetInt32(paidEntries.Count);
        var winnerEntry = paidEntries[winnerIndex];

        raffle.WinnerId = winnerEntry.UserId;
        raffle.WinnerSpotNumber = winnerEntry.SpotNumber;
        raffle.Status = "drawn";
        raffle.DrawnAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Raffle {RaffleId} drawn — winner: user {WinnerId} spot #{Spot}",
            raffleId, winnerEntry.UserId, winnerEntry.SpotNumber);

        await _context.Entry(raffle).Reference(r => r.Winner).LoadAsync();
        return MapToDto(raffle);
    }
}
