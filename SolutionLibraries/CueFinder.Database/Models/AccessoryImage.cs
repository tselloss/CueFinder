namespace CueFinder.Database.Models
{
    /// <summary>
    /// Image associated with an accessory listing
    /// </summary>
    public class AccessoryImage
    {
        public int Id { get; set; }
        public int AccessoryId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public string? AltText { get; set; }
        public int DisplayOrder { get; set; } = 0;
        public bool IsPrimary { get; set; } = false;
        public DateTime UploadedAt { get; set; }

        public virtual Accessory? Accessory { get; set; }
    }
}
