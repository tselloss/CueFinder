using CueFinder.Database.Models;
using CueFinder.Raffles.Models;

namespace CueFinder.Raffles.Services;

public partial class RaffleService
{
    private static readonly TimeSpan PendingTtl = TimeSpan.FromHours(36);

    private RaffleResponseDto MapToDto(Raffle r)
    {
        var now = DateTime.UtcNow;
        // Exclude pending entries whose 36-hour window has elapsed (lazy expiry)
        var activeEntries = r.Entries
            .Where(e => e.Status != "pending" || e.CreatedAt.Add(PendingTtl) >= now)
            .ToList();

        var claimed = activeEntries.Count;
        var paid    = activeEntries.Count(e => e.Status == "paid");

        return new RaffleResponseDto
        {
            Id = r.Id,
            OrganizerId = r.OrganizerId,
            OrganizerName = r.Organizer?.Name ?? string.Empty,
            OrganizerUsername = r.Organizer?.Username ?? string.Empty,

            Title = r.Title,
            Description = r.Description,
            ItemImageUrl = r.ItemImageUrl,

            TotalSpots = r.TotalSpots,
            PricePerSpot = r.PricePerSpot,
            EndsAt = r.EndsAt,

            AcceptPayPal = r.AcceptPayPal,
            AcceptRevolut = r.AcceptRevolut,
            AcceptBankTransfer = r.AcceptBankTransfer,
            AcceptViva = r.AcceptViva,
            AcceptIris = r.AcceptIris,
            AcceptDM = r.AcceptDM,
            PaymentDetails = r.PaymentDetails,

            Status = r.Status,

            WinnerId = r.WinnerId,
            WinnerUsername = r.Winner?.Username,
            WinnerSpotNumber = r.WinnerSpotNumber,
            WinnerCardImageUrl = r.WinnerCardImageUrl,

            CreatedAt = r.CreatedAt,
            DrawnAt = r.DrawnAt,

            TotalClaimed = claimed,
            TotalPaid = paid,
            SpotsAvailable = r.TotalSpots - claimed,

            Entries = activeEntries
                .OrderBy(e => e.SpotNumber)
                .Select(MapEntryToDto)
                .ToList()
        };
    }

    private static RaffleEntryResponseDto MapEntryToDto(RaffleEntry e) => new()
    {
        Id = e.Id,
        RaffleId = e.RaffleId,
        UserId = e.UserId,
        Username = e.User?.Username ?? string.Empty,
        SpotNumber = e.SpotNumber,
        Status = e.Status,
        PaymentMethod = e.PaymentMethod,
        PaymentReference = e.PaymentReference,
        CreatedAt = e.CreatedAt,
        PaidAt = e.PaidAt,
        PendingExpiresAt = e.Status == "pending" ? e.CreatedAt.Add(PendingTtl) : null
    };
}
