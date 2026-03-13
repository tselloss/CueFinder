namespace CueFinderBookingBE.Models;

public class BuddyPost
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string? LocationName { get; set; }
    public DateTime PlayDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string SkillLevel { get; set; } = "beginner";
    public string? Notes { get; set; }
    public string Status { get; set; } = "open"; // open | matched | closed
    public DateTime CreatedAt { get; set; }

    public ICollection<BuddyRequest> Requests { get; set; } = new List<BuddyRequest>();
}

public class BuddyRequest
{
    public Guid Id { get; set; }
    public Guid BuddyPostId { get; set; }
    public BuddyPost? BuddyPost { get; set; }

    public Guid RequesterId { get; set; }
    public string RequesterName { get; set; } = string.Empty;
    public string SkillLevel { get; set; } = "beginner";
    public string? Message { get; set; }
    public string Status { get; set; } = "pending"; // pending | accepted | declined

    public int? ReviewScore { get; set; }
    public string? ReviewNote { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BilliardClubRecord
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string SocialLink { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal? DefaultHourlyRate { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<BilliardClubLocation> Locations { get; set; } = new List<BilliardClubLocation>();
    public ICollection<BilliardClubCoOwner> CoOwners { get; set; } = new List<BilliardClubCoOwner>();
    public ICollection<BilliardClubBooking> Bookings { get; set; } = new List<BilliardClubBooking>();
}

public class BilliardClubLocation
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public BilliardClubRecord? Record { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Region { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public ICollection<BilliardClubTable> Tables { get; set; } = new List<BilliardClubTable>();
    public string OpeningHours { get; set; } = string.Empty;
    public string SpecialNotes { get; set; } = string.Empty;
    public string Latitude { get; set; } = string.Empty;
    public string Longitude { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BilliardClubTable
{
    public Guid Id { get; set; }
    public Guid LocationId { get; set; }
    public BilliardClubLocation? Location { get; set; }

    public string Name { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public decimal? HourlyRate { get; set; }
    public DateTime CreatedAt { get; set; }

    public ICollection<BilliardClubBooking> Bookings { get; set; } = new List<BilliardClubBooking>();
    public ICollection<TableSession> Sessions { get; set; } = new List<TableSession>();
}

public class TableSession
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public BilliardClubTable? Table { get; set; }

    public Guid LocationId { get; set; }
    public Guid RecordId { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public decimal? HourlyRate { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public int? TotalMinutes { get; set; }
    public decimal? TotalCost { get; set; }

    public Guid StartedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BilliardClubCoOwner
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public BilliardClubRecord? Record { get; set; }

    public Guid? CoOwnerUserId { get; set; }
    public string CoOwnerUsername { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public Guid? ApprovedByUserId { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class BilliardClubBooking
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public BilliardClubRecord? Record { get; set; }

    public Guid LocationId { get; set; }
    public BilliardClubLocation? Location { get; set; }

    public Guid TableId { get; set; }
    public BilliardClubTable? Table { get; set; }

    public Guid CreatedByUserId { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = "pending";
    public string Notes { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
