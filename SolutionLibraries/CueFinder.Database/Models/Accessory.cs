namespace CueFinder.Database.Models
{
    /// <summary>
    /// Accessory listing entity (e.g., gloves, tips, chalk, etc.)
    /// </summary>
    public class Accessory
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Condition { get; set; } = string.Empty;
        public string AccessoryType { get; set; } = string.Empty;
        public string? Material { get; set; }
        public string? Size { get; set; }
        public string? Color { get; set; }
        public string Location { get; set; } = string.Empty;
        public bool IsSold { get; set; } = false;
        public DateTime? SoldDate { get; set; }
        public int UserId { get; set; }
        public virtual User? User { get; set; }
        public int ViewCount { get; set; } = 0;
        public decimal AverageRating { get; set; } = 0;
        public int RatingCount { get; set; } = 0;
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        public virtual ICollection<AccessoryImage>? Images { get; set; }
    }
}
