namespace CueFinder.Raffles.Models;

public class RaffleEntryResponseDto
{
    public int Id { get; set; }
    public int RaffleId { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public int SpotNumber { get; set; }
    public string Status { get; set; } = "pending";
    public string? PaymentMethod { get; set; }
    public string? PaymentReference { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
}
