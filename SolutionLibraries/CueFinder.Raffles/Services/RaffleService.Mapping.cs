using CueFinder.Database.Models;
using CueFinder.Raffles.Models;

namespace CueFinder.Raffles.Services;

public partial class RaffleService
{
    private RaffleResponseDto MapToDto(Raffle r)
    {
        var claimed = r.Entries.Count;
        var paid    = r.Entries.Count(e => e.Status == "paid");

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

            CreatedAt = r.CreatedAt,
            DrawnAt = r.DrawnAt,

            TotalClaimed = claimed,
            TotalPaid = paid,
            SpotsAvailable = r.TotalSpots - claimed,

            Entries = r.Entries
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
        PaidAt = e.PaidAt
    };
}
