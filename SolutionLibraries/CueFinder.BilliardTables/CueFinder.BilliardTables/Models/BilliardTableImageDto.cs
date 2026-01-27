namespace CueFinder.BilliardTables.Models;

/// <summary>
/// DTO for billiard table image information
/// </summary>
public class BilliardTableImageDto
{
    public int Id { get; set; }
    public int BilliardTableId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; }
}
