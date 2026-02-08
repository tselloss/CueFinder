using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CueFinder.Database.Context;
using CueFinderBookingBE.Data;
using CueFinderBookingBE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CueFinderBookingBE.Controllers;

[ApiController]
[Route("api/clubs")]
public class ClubsController : ControllerBase
{
    private readonly BookingDbContext _context;
    private readonly CueFinderDbContext _dbContext;
    private readonly ILogger<ClubsController> _logger;

    public ClubsController(BookingDbContext context, CueFinderDbContext dbContext, ILogger<ClubsController> logger)
    {
        _context = context;
        _dbContext = dbContext;
        _logger = logger;
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var guidId))
        {
            return guidId;
        }

        if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out _))
        {
            using var md5 = MD5.Create();
            var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(userIdClaim));
            return new Guid(hash);
        }

        return Guid.Empty;
    }

    private string GetUserRoleFromClaims()
    {
        return User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;
    }

    private static Guid ConvertIntUserIdToGuid(int userId)
    {
        using var md5 = MD5.Create();
        var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(userId.ToString()));
        return new Guid(hash);
    }

    private static bool IsAdminRole(string role)
    {
        return string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase);
    }

    private static bool CanEditClubRecord(BilliardClubRecord record, Guid userId, bool isAdmin)
    {
        if (isAdmin) return true;
        if (record.OwnerUserId == userId) return true;
        return record.CoOwners.Any(c =>
            string.Equals(c.Status, "approved", StringComparison.OrdinalIgnoreCase)
            && c.CoOwnerUserId.HasValue
            && c.CoOwnerUserId.Value == userId);
    }

    private Guid? GetTenantRecordId()
    {
        var headerValue = Request.Headers["X-Club-Record-Id"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(headerValue) && Guid.TryParse(headerValue, out var headerId))
        {
            return headerId;
        }

        var claimValue = User.FindFirst("recordId")?.Value
            ?? User.FindFirst("tenant_record_id")?.Value;

        if (!string.IsNullOrWhiteSpace(claimValue) && Guid.TryParse(claimValue, out var claimId))
        {
            return claimId;
        }

        return null;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClubRecordResponseDto>>> GetClubRecords()
    {
        try
        {
            var tenantRecordId = GetTenantRecordId();
            var query = _context.BilliardClubRecords
                .Include(r => r.Locations)
                .ThenInclude(l => l.Tables)
                .Include(r => r.CoOwners)
                .OrderByDescending(r => r.UpdatedAt)
                .AsQueryable();

            if (User?.Identity?.IsAuthenticated == true)
            {
                var userId = GetUserIdFromClaims();
                var role = GetUserRoleFromClaims();
                var isAdmin = IsAdminRole(role);
                var isOwnerRole = string.Equals(role, "club_owner", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(role, "clubowner", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(role, "club owner", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(role, "owner", StringComparison.OrdinalIgnoreCase);

                if (!isAdmin && isOwnerRole)
                {
                    var username = User.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
                    var email = User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
                    var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                    if ((string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(username))
                        && !string.IsNullOrWhiteSpace(userIdClaim)
                        && int.TryParse(userIdClaim, out var intUserId))
                    {
                        var userProfile = await _dbContext.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Id == intUserId);

                        if (userProfile != null)
                        {
                            if (string.IsNullOrWhiteSpace(email))
                            {
                                email = userProfile.Email ?? string.Empty;
                            }

                            if (string.IsNullOrWhiteSpace(username))
                            {
                                username = userProfile.Username ?? string.Empty;
                            }
                        }
                    }

                    var emailLower = (email ?? string.Empty).ToLowerInvariant();
                    var usernameLower = (username ?? string.Empty).ToLowerInvariant();

                    query = query.Where(r =>
                        (userId != Guid.Empty && r.OwnerUserId == userId)
                        || (!string.IsNullOrWhiteSpace(emailLower) && (r.OwnerEmail ?? string.Empty).ToLower() == emailLower)
                        || (!string.IsNullOrWhiteSpace(usernameLower) && (r.OwnerName ?? string.Empty).ToLower() == usernameLower)
                        || r.CoOwners.Any(c =>
                            (c.Status ?? string.Empty).ToLower() == "approved"
                            && ((userId != Guid.Empty && c.CoOwnerUserId.HasValue && c.CoOwnerUserId.Value == userId)
                                || (!string.IsNullOrWhiteSpace(emailLower) && (c.Email ?? string.Empty).ToLower() == emailLower)
                                || (!string.IsNullOrWhiteSpace(usernameLower) && (c.CoOwnerUsername ?? string.Empty).ToLower() == usernameLower))));
                }
            }

            if (tenantRecordId.HasValue)
            {
                query = query.Where(r => r.Id == tenantRecordId.Value);
            }

            var records = await query.ToListAsync();

            var result = records.Select(r => new ClubRecordResponseDto
            {
                Id = r.Id,
                OwnerUserId = r.OwnerUserId,
                OwnerName = r.OwnerName,
                OwnerEmail = r.OwnerEmail,
                OwnerPhone = r.OwnerPhone,
                Website = r.Website,
                SocialLink = r.SocialLink,
                LogoUrl = r.SocialLink,
                Description = r.Description,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                Locations = r.Locations.Select(l => new ClubLocationDto
                {
                    Id = l.Id,
                    Name = l.Name,
                    Address = l.Address,
                    City = l.City,
                    Region = l.Region,
                    Country = l.Country,
                    Tables = l.Tables.Select(t => new ClubTableDto
                    {
                        Id = t.Id,
                        Name = t.Name,
                        Notes = t.Notes
                    }).ToList(),
                    OpeningHours = l.OpeningHours,
                    SpecialNotes = l.SpecialNotes,
                    Latitude = l.Latitude,
                    Longitude = l.Longitude
                }).ToList(),
                CoOwners = r.CoOwners.Select(c => new ClubCoOwnerDto
                {
                    Id = c.Id,
                    Email = c.Email,
                    Username = c.CoOwnerUsername,
                    Status = c.Status,
                    ApprovedAt = c.ApprovedAt
                }).ToList()
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting club records");
            return StatusCode(500, "Error retrieving club records");
        }
    }

    [HttpPost]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult<ClubRecordResponseDto>> CreateClubRecord([FromBody] ClubRecordUpsertDto dto)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue)
            {
                return Forbid();
            }

            var existing = await _context.BilliardClubRecords.FirstOrDefaultAsync(r => r.OwnerUserId == userId);
            if (existing != null)
            {
                return BadRequest("A club record already exists for this owner");
            }

            var record = new BilliardClubRecord
            {
                Id = Guid.NewGuid(),
                OwnerUserId = userId,
                OwnerName = dto.OwnerName ?? string.Empty,
                OwnerEmail = dto.OwnerEmail ?? string.Empty,
                OwnerPhone = dto.OwnerPhone ?? string.Empty,
                Website = dto.Website ?? string.Empty,
                SocialLink = dto.LogoUrl ?? dto.SocialLink ?? string.Empty,
                Description = dto.Description ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Locations = dto.Locations.Select(l => new BilliardClubLocation
                {
                    Id = Guid.NewGuid(),
                    Name = l.Name ?? string.Empty,
                    Address = l.Address ?? string.Empty,
                    City = l.City ?? string.Empty,
                    Region = l.Region ?? string.Empty,
                    Country = l.Country ?? string.Empty,
                    OpeningHours = l.OpeningHours ?? string.Empty,
                    SpecialNotes = l.SpecialNotes ?? string.Empty,
                    Latitude = l.Latitude ?? string.Empty,
                    Longitude = l.Longitude ?? string.Empty,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Tables = (l.Tables ?? new List<ClubTableDto>()).Select(t => new BilliardClubTable
                    {
                        Id = Guid.NewGuid(),
                        Name = t.Name ?? string.Empty,
                        Notes = t.Notes ?? string.Empty,
                        CreatedAt = DateTime.UtcNow
                    }).ToList()
                }).ToList()
            };

            _context.BilliardClubRecords.Add(record);
            await _context.SaveChangesAsync();

            return Ok(await BuildClubRecordResponseAsync(record.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating club record");
            return StatusCode(500, "Error creating club record");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult<ClubRecordResponseDto>> UpdateClubRecord(Guid id, [FromBody] ClubRecordUpsertDto dto)
    {
        try
        {
            var record = await _context.BilliardClubRecords
                .Include(r => r.Locations)
                .ThenInclude(l => l.Tables)
                .Include(r => r.CoOwners)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var isAdmin = IsAdminRole(GetUserRoleFromClaims());
            if (!CanEditClubRecord(record, userId, isAdmin))
            {
                return Forbid();
            }

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue && record.Id != tenantRecordId.Value)
            {
                return Forbid();
            }

            record.OwnerName = dto.OwnerName ?? string.Empty;
            record.OwnerEmail = dto.OwnerEmail ?? string.Empty;
            record.OwnerPhone = dto.OwnerPhone ?? string.Empty;
            record.Website = dto.Website ?? string.Empty;
            record.SocialLink = dto.LogoUrl ?? dto.SocialLink ?? string.Empty;
            record.Description = dto.Description ?? string.Empty;
            record.UpdatedAt = DateTime.UtcNow;

            var dtoLocations = dto.Locations ?? new List<ClubLocationDto>();
            if (dtoLocations.Count > 0)
            {
                var existingLocations = record.Locations.ToList();
                var dtoLocationIds = dtoLocations
                    .Where(l => l.Id.HasValue && l.Id.Value != Guid.Empty)
                    .Select(l => l.Id!.Value)
                    .ToHashSet();

                foreach (var dtoLocation in dtoLocations)
                {
                    var locationId = dtoLocation.Id ?? Guid.Empty;
                    var location = locationId != Guid.Empty
                        ? existingLocations.FirstOrDefault(l => l.Id == locationId)
                        : null;

                    if (location == null)
                    {
                        location = new BilliardClubLocation
                        {
                            Id = Guid.NewGuid(),
                            RecordId = record.Id,
                            Name = dtoLocation.Name ?? string.Empty,
                            Address = dtoLocation.Address ?? string.Empty,
                            City = dtoLocation.City ?? string.Empty,
                            Region = dtoLocation.Region ?? string.Empty,
                            Country = dtoLocation.Country ?? string.Empty,
                            OpeningHours = dtoLocation.OpeningHours ?? string.Empty,
                            SpecialNotes = dtoLocation.SpecialNotes ?? string.Empty,
                            Latitude = dtoLocation.Latitude ?? string.Empty,
                            Longitude = dtoLocation.Longitude ?? string.Empty,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        };
                        record.Locations.Add(location);
                    }
                    else
                    {
                        location.Name = dtoLocation.Name ?? string.Empty;
                        location.Address = dtoLocation.Address ?? string.Empty;
                        location.City = dtoLocation.City ?? string.Empty;
                        location.Region = dtoLocation.Region ?? string.Empty;
                        location.Country = dtoLocation.Country ?? string.Empty;
                        location.OpeningHours = dtoLocation.OpeningHours ?? string.Empty;
                        location.SpecialNotes = dtoLocation.SpecialNotes ?? string.Empty;
                        location.Latitude = dtoLocation.Latitude ?? string.Empty;
                        location.Longitude = dtoLocation.Longitude ?? string.Empty;
                        location.UpdatedAt = DateTime.UtcNow;
                    }

                    var dtoTables = dtoLocation.Tables ?? new List<ClubTableDto>();
                    var dtoTableIds = dtoTables
                        .Where(t => t.Id.HasValue && t.Id.Value != Guid.Empty)
                        .Select(t => t.Id!.Value)
                        .ToHashSet();

                    var existingTables = location.Tables.ToList();

                    foreach (var dtoTable in dtoTables)
                    {
                        var tableId = dtoTable.Id ?? Guid.Empty;
                        var table = tableId != Guid.Empty
                            ? existingTables.FirstOrDefault(t => t.Id == tableId)
                            : null;

                        if (table == null)
                        {
                            location.Tables.Add(new BilliardClubTable
                            {
                                Id = Guid.NewGuid(),
                                LocationId = location.Id,
                                Name = dtoTable.Name ?? string.Empty,
                                Notes = dtoTable.Notes ?? string.Empty,
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                        else
                        {
                            table.Name = dtoTable.Name ?? string.Empty;
                            table.Notes = dtoTable.Notes ?? string.Empty;
                        }
                    }

                    var removableTables = existingTables.Where(t => !dtoTableIds.Contains(t.Id)).ToList();
                    foreach (var table in removableTables)
                    {
                        var hasBookings = await _context.BilliardClubBookings.AnyAsync(b => b.TableId == table.Id);
                        if (!hasBookings)
                        {
                            _context.BilliardClubTables.Remove(table);
                        }
                    }
                }

                var removableLocations = existingLocations.Where(l => !dtoLocationIds.Contains(l.Id)).ToList();
                foreach (var location in removableLocations)
                {
                    var hasBookings = await _context.BilliardClubBookings.AnyAsync(b => b.LocationId == location.Id);
                    if (!hasBookings)
                    {
                        _context.BilliardClubLocations.Remove(location);
                    }
                }
            }

            await _context.SaveChangesAsync();

            return Ok(await BuildClubRecordResponseAsync(record.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating club record");
            return StatusCode(500, "Error updating club record");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult> DeleteClubRecord(Guid id)
    {
        try
        {
            var record = await _context.BilliardClubRecords
                .Include(r => r.CoOwners)
                .Include(r => r.Locations)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var isAdmin = IsAdminRole(GetUserRoleFromClaims());
            if (!isAdmin && record.OwnerUserId != userId)
            {
                return Forbid();
            }

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue && record.Id != tenantRecordId.Value)
            {
                return Forbid();
            }

            _context.BilliardClubRecords.Remove(record);
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting club record");
            return StatusCode(500, "Error deleting club record");
        }
    }

    [HttpPost("{id}/coowners")]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult<ClubRecordResponseDto>> RequestCoOwner(Guid id, [FromBody] ClubCoOwnerRequestDto dto)
    {
        try
        {
            var record = await _context.BilliardClubRecords
                .Include(r => r.CoOwners)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var isAdmin = IsAdminRole(GetUserRoleFromClaims());
            if (!isAdmin && record.OwnerUserId != userId)
            {
                return Forbid();
            }

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue && record.Id != tenantRecordId.Value)
            {
                return Forbid();
            }

            if (string.IsNullOrWhiteSpace(dto.EmailOrUsername))
            {
                return BadRequest("Co-owner identifier is required");
            }

            var key = dto.EmailOrUsername.Trim().ToLowerInvariant();
            var existing = record.CoOwners.FirstOrDefault(c => c.Email.ToLower() == key || c.CoOwnerUsername.ToLower() == key);
            if (existing != null)
            {
                return Ok(await BuildClubRecordResponseAsync(record.Id));
            }

            var matchedUser = await _dbContext.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == key || u.Username.ToLower() == key);

            var coOwner = new BilliardClubCoOwner
            {
                Id = Guid.NewGuid(),
                RecordId = record.Id,
                Email = matchedUser?.Email ?? dto.EmailOrUsername.Trim(),
                CoOwnerUsername = matchedUser?.Username ?? string.Empty,
                CoOwnerUserId = matchedUser != null ? ConvertIntUserIdToGuid(matchedUser.Id) : null,
                Status = "pending",
                CreatedAt = DateTime.UtcNow
            };

            record.CoOwners.Add(coOwner);
            record.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(await BuildClubRecordResponseAsync(record.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error requesting co-owner");
            return StatusCode(500, "Error requesting co-owner");
        }
    }

    [HttpPost("{id}/coowners/{coOwnerId}/approve")]
    [Authorize(Roles = "admin")]
    public async Task<ActionResult<ClubRecordResponseDto>> ApproveCoOwner(Guid id, Guid coOwnerId)
    {
        try
        {
            var record = await _context.BilliardClubRecords
                .Include(r => r.CoOwners)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (record == null)
            {
                return NotFound();
            }

            var coOwner = record.CoOwners.FirstOrDefault(c => c.Id == coOwnerId);
            if (coOwner == null)
            {
                return NotFound();
            }

            coOwner.Status = "approved";
            coOwner.ApprovedAt = DateTime.UtcNow;
            coOwner.ApprovedByUserId = GetUserIdFromClaims();
            record.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(await BuildClubRecordResponseAsync(record.Id));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving co-owner");
            return StatusCode(500, "Error approving co-owner");
        }
    }

    private async Task<ClubRecordResponseDto> BuildClubRecordResponseAsync(Guid recordId)
    {
        var record = await _context.BilliardClubRecords
            .Include(r => r.Locations)
            .ThenInclude(l => l.Tables)
            .Include(r => r.CoOwners)
            .FirstAsync(r => r.Id == recordId);

        return new ClubRecordResponseDto
        {
            Id = record.Id,
            OwnerUserId = record.OwnerUserId,
            OwnerName = record.OwnerName,
            OwnerEmail = record.OwnerEmail,
            OwnerPhone = record.OwnerPhone,
            Website = record.Website,
            SocialLink = record.SocialLink,
            LogoUrl = record.SocialLink,
            Description = record.Description,
            CreatedAt = record.CreatedAt,
            UpdatedAt = record.UpdatedAt,
            Locations = record.Locations.Select(l => new ClubLocationDto
            {
                Id = l.Id,
                Name = l.Name,
                Address = l.Address,
                City = l.City,
                Region = l.Region,
                Country = l.Country,
                Tables = l.Tables.Select(t => new ClubTableDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Notes = t.Notes
                }).ToList(),
                OpeningHours = l.OpeningHours,
                SpecialNotes = l.SpecialNotes,
                Latitude = l.Latitude,
                Longitude = l.Longitude
            }).ToList(),
            CoOwners = record.CoOwners.Select(c => new ClubCoOwnerDto
            {
                Id = c.Id,
                Email = c.Email,
                Username = c.CoOwnerUsername,
                Status = c.Status,
                ApprovedAt = c.ApprovedAt
            }).ToList()
        };
    }
}

public class ClubRecordUpsertDto
{
    public string? OwnerName { get; set; }
    public string? OwnerEmail { get; set; }
    public string? OwnerPhone { get; set; }
    public string? Website { get; set; }
    public string? SocialLink { get; set; }
    public string? LogoUrl { get; set; }
    public string? Description { get; set; }
    public List<ClubLocationDto> Locations { get; set; } = new();
}

public class ClubRecordResponseDto
{
    public Guid Id { get; set; }
    public Guid OwnerUserId { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public string OwnerEmail { get; set; } = string.Empty;
    public string OwnerPhone { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string SocialLink { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<ClubLocationDto> Locations { get; set; } = new();
    public List<ClubCoOwnerDto> CoOwners { get; set; } = new();
}

public class ClubLocationDto
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public List<ClubTableDto>? Tables { get; set; }
    public string? OpeningHours { get; set; }
    public string? SpecialNotes { get; set; }
    public string? Latitude { get; set; }
    public string? Longitude { get; set; }
}

public class ClubTableDto
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Notes { get; set; }
}

public class ClubCoOwnerDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? ApprovedAt { get; set; }
}

public class ClubCoOwnerRequestDto
{
    public string EmailOrUsername { get; set; } = string.Empty;
}
