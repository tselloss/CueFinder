namespace CueFinder.Database.Models
{
    /// <summary>
    /// Image associated with a cue set listing
    /// </summary>
    public class CueSetImage
    {
        public int Id { get; set; }
        public int CueSetId { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime UploadedAt { get; set; }
        public virtual CueSet? CueSet { get; set; }
    }
}
