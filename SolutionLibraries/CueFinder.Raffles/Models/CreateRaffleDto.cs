using System.ComponentModel.DataAnnotations;

namespace CueFinder.Raffles.Models;

public class CreateRaffleDto
{
    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ItemImageUrl { get; set; }

    [Range(2, 1000)]
    public int TotalSpots { get; set; }

    [Range(0.01, 100000)]
    public decimal PricePerSpot { get; set; }

    public DateTime EndsAt { get; set; }

    // Payment methods
    public bool AcceptPayPal { get; set; }
    public bool AcceptRevolut { get; set; }
    public bool AcceptBankTransfer { get; set; }
    public bool AcceptViva { get; set; }
    public bool AcceptIris { get; set; }
    public bool AcceptDM { get; set; } = true;

    [MaxLength(500)]
    public string? PaymentDetails { get; set; }
}
