namespace CueFinder.Database.Models
{
    /// <summary>
    /// A single spot claimed by a user in a raffle.
    /// Status: pending (claimed, not yet paid) | paid (organizer verified) | refunded
    /// </summary>
    public class RaffleEntry
    {
        public int Id { get; set; }

        public int RaffleId { get; set; }
        public virtual Raffle? Raffle { get; set; }

        public int UserId { get; set; }
        public virtual User? User { get; set; }

        /// <summary>Spot number within the raffle (1..TotalSpots, unique per raffle)</summary>
        public int SpotNumber { get; set; }

        // Status: pending | paid | refunded
        public string Status { get; set; } = "pending";

        public string? PaymentMethod { get; set; }
        public string? PaymentReference { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
