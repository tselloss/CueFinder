namespace CueFinder.Raffles.Models;

public class RaffleResponseDto
{
    public int Id { get; set; }
    public int OrganizerId { get; set; }
    public string OrganizerName { get; set; } = string.Empty;
    public string OrganizerUsername { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ItemImageUrl { get; set; }

    public int TotalSpots { get; set; }
    public decimal PricePerSpot { get; set; }
    public DateTime EndsAt { get; set; }

    // Payment methods
    public bool AcceptPayPal { get; set; }
    public bool AcceptRevolut { get; set; }
    public bool AcceptBankTransfer { get; set; }
    public bool AcceptViva { get; set; }
    public bool AcceptIris { get; set; }
    public bool AcceptDM { get; set; }
    public string? PaymentDetails { get; set; }

    public string Status { get; set; } = "open";

    // Winner
    public int? WinnerId { get; set; }
    public string? WinnerUsername { get; set; }
    public int? WinnerSpotNumber { get; set; }
    public string? WinnerCardImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? DrawnAt { get; set; }

    // Aggregated spot counts
    public int TotalClaimed { get; set; }
    public int TotalPaid { get; set; }
    public int SpotsAvailable { get; set; }

    public List<RaffleEntryResponseDto> Entries { get; set; } = new();
}
