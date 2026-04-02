namespace CueFinder.Database.Models
{
    /// <summary>
    /// A raffle listing created by a seller for a billiards item.
    /// Participants claim spots and pay off-platform; the seller draws a winner.
    /// </summary>
    public class Raffle
    {
        public int Id { get; set; }

        // Organizer
        public int OrganizerId { get; set; }
        public virtual User? Organizer { get; set; }

        // Item info
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? ItemImageUrl { get; set; }

        // Raffle parameters
        public int TotalSpots { get; set; }
        public decimal PricePerSpot { get; set; }
        public DateTime EndsAt { get; set; }
        public bool AutoEndWhenFull { get; set; } = false;

        // Accepted payment methods (European / GR friendly)
        public bool AcceptPayPal { get; set; } = false;
        public bool AcceptRevolut { get; set; } = false;
        public bool AcceptBankTransfer { get; set; } = false;
        public bool AcceptViva { get; set; } = false;   // Viva Wallet – popular in GR
        public bool AcceptIris { get; set; } = false;   // IRIS Pay – Greek instant bank transfer
        public bool AcceptDM { get; set; } = true;      // Arrange payment via private message

        /// <summary>
        /// Free-text payment details shown to entrants
        /// (e.g. "PayPal: seller@email.com | Revolut: @handle | IBAN: GR...")
        /// </summary>
        public string? PaymentDetails { get; set; }

        // Status: open | closed | drawn | cancelled
        public string Status { get; set; } = "open";

        // Winner (set after draw)
        public int? WinnerId { get; set; }
        public virtual User? Winner { get; set; }
        public int? WinnerSpotNumber { get; set; }
        public string? WinnerCardImageUrl { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? DrawnAt { get; set; }

        public virtual ICollection<RaffleEntry> Entries { get; set; } = new List<RaffleEntry>();
    }
}
