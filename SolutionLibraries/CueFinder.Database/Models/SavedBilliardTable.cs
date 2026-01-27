namespace CueFinder.Database.Models
{
    /// <summary>
    /// Represents a billiard table saved/favorited by a user
    /// </summary>
    public class SavedBilliardTable
    {
        /// <summary>
        /// Unique identifier
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of the user who saved the table
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// User who saved the table (navigation property)
        /// </summary>
        public virtual User? User { get; set; }

        /// <summary>
        /// ID of the saved billiard table
        /// </summary>
        public int BilliardTableId { get; set; }

        /// <summary>
        /// Saved billiard table (navigation property)
        /// </summary>
        public virtual BilliardTable? BilliardTable { get; set; }

        /// <summary>
        /// When the table was saved
        /// </summary>
        public DateTime SavedAt { get; set; } = DateTime.UtcNow;
    }
}
