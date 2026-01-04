namespace CueFinder.Database.Models
{
    /// <summary>
    /// Transaction/Sale record
    /// </summary>
    public class Transaction
    {
        /// <summary>
        /// Unique transaction identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the cue being sold
        /// </summary>
        public int CueId { get; set; }

        /// <summary>
        /// Cue being sold (navigation property)
        /// </summary>
        public virtual Cue? Cue { get; set; }

        /// <summary>
        /// ID of the seller
        /// </summary>
        public int SellerId { get; set; }

        /// <summary>
        /// Seller (navigation property)
        /// </summary>
        public virtual User? Seller { get; set; }

        /// <summary>
        /// ID of the buyer
        /// </summary>
        public int BuyerId { get; set; }

        /// <summary>
        /// Buyer (navigation property)
        /// </summary>
        public virtual User? Buyer { get; set; }

        /// <summary>
        /// Final sale price
        /// </summary>
        public decimal SalePrice { get; set; }

        /// <summary>
        /// Transaction status (pending, completed, cancelled, disputed)
        /// </summary>
        public string Status { get; set; } = "pending";

        /// <summary>
        /// Agreed shipping method (local pickup, shipped, etc.)
        /// </summary>
        public string ShippingMethod { get; set; } = "local_pickup";

        /// <summary>
        /// Shipping cost
        /// </summary>
        public decimal? ShippingCost { get; set; }

        /// <summary>
        /// Payment method used (cash, paypal, stripe, etc.)
        /// </summary>
        public string PaymentMethod { get; set; } = "cash";

        /// <summary>
        /// Transaction/Order number (for reference)
        /// </summary>
        public string TransactionNumber { get; set; } = string.Empty;

        /// <summary>
        /// Notes about the transaction
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Transaction creation timestamp
        /// </summary>
        public DateTime CreatedAt { get; set; }

        /// <summary>
        /// Transaction completion timestamp
        /// </summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>
        /// Last update timestamp
        /// </summary>
        public DateTime UpdatedAt { get; set; }
    }
}
