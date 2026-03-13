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
[Route("api/bookings")]
public class BookingsController : ControllerBase
{
    private readonly BookingDbContext _context;
    private readonly CueFinderDbContext _dbContext;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(BookingDbContext context, CueFinderDbContext dbContext, ILogger<BookingsController> logger)
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

    private static string NormalizeBookingStatus(string? status)
    {
        var normalized = (status ?? string.Empty).Trim().ToLowerInvariant();
        return normalized switch
        {
            "confirmed" => "confirmed",
            "cancelled" => "cancelled",
            "completed" => "completed",
            "pending" => "pending",
            _ => "pending"
        };
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

    private async Task<(string Email, string Username)> GetUserIdentityAsync()
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

        return (email ?? string.Empty, username ?? string.Empty);
    }

    private async Task<List<Guid>> GetEditableRecordIdsAsync(Guid userId, bool isAdmin)
    {
        if (isAdmin)
        {
            return await _context.BilliardClubRecords.Select(r => r.Id).ToListAsync();
        }

        var identity = await GetUserIdentityAsync();
        var emailLower = (identity.Email ?? string.Empty).ToLowerInvariant();
        var usernameLower = (identity.Username ?? string.Empty).ToLowerInvariant();

        return await _context.BilliardClubRecords
            .Include(r => r.CoOwners)
            .Where(r =>
                (userId != Guid.Empty && r.OwnerUserId == userId)
                || (!string.IsNullOrWhiteSpace(emailLower) && (r.OwnerEmail ?? string.Empty).ToLower() == emailLower)
                || (!string.IsNullOrWhiteSpace(usernameLower) && (r.OwnerName ?? string.Empty).ToLower() == usernameLower)
                || r.CoOwners.Any(c =>
                    (c.Status ?? string.Empty).ToLower() == "approved"
                    && ((userId != Guid.Empty && c.CoOwnerUserId.HasValue && c.CoOwnerUserId.Value == userId)
                        || (!string.IsNullOrWhiteSpace(emailLower) && (c.Email ?? string.Empty).ToLower() == emailLower)
                        || (!string.IsNullOrWhiteSpace(usernameLower) && (c.CoOwnerUsername ?? string.Empty).ToLower() == usernameLower))))
            .Select(r => r.Id)
            .ToListAsync();
    }

    [HttpGet]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetBookings([FromQuery] Guid? recordId, [FromQuery] Guid? tableId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var isAdmin = IsAdminRole(GetUserRoleFromClaims());
            var editableRecordIds = await GetEditableRecordIdsAsync(userId, isAdmin);
            if (!isAdmin && editableRecordIds.Count == 0)
            {
                return Ok(new List<BookingResponseDto>());
            }

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue && !isAdmin && !editableRecordIds.Contains(tenantRecordId.Value))
            {
                return Forbid();
            }

            var query = _context.BilliardClubBookings
                .Include(b => b.Location)
                .Include(b => b.Table)
                .Where(b => isAdmin || editableRecordIds.Contains(b.RecordId));

            if (recordId.HasValue)
            {
                query = query.Where(b => b.RecordId == recordId.Value);
            }

            if (tenantRecordId.HasValue)
            {
                query = query.Where(b => b.RecordId == tenantRecordId.Value);
            }

            if (tableId.HasValue)
            {
                query = query.Where(b => b.TableId == tableId.Value);
            }

            if (from.HasValue)
            {
                query = query.Where(b => b.EndTime >= from.Value);
            }

            if (to.HasValue)
            {
                query = query.Where(b => b.StartTime <= to.Value);
            }

            var bookings = await query
                .OrderByDescending(b => b.StartTime)
                .ToListAsync();

            var result = bookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                RecordId = b.RecordId,
                LocationId = b.LocationId,
                TableId = b.TableId,
                LocationName = b.Location?.Name ?? string.Empty,
                TableName = b.Table?.Name ?? string.Empty,
                CustomerName = b.CustomerName,
                CustomerEmail = b.CustomerEmail,
                CustomerPhone = b.CustomerPhone,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                Notes = b.Notes,
                CreatedByUserId = b.CreatedByUserId,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting bookings");
            return StatusCode(500, "Error retrieving bookings");
        }
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> CreateBooking([FromBody] BookingCreateDto dto)
    {
        try
        {
            if (dto.StartTime >= dto.EndTime)
            {
                return BadRequest("End time must be after start time");
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var table = await _context.BilliardClubTables
                .Include(t => t.Location)
                .ThenInclude(l => l.Record)
                .FirstOrDefaultAsync(t => t.Id == dto.TableId);

            if (table == null || table.Location?.Record == null)
            {
                return NotFound("Table not found");
            }

            var record = table.Location!.Record!;
            var isAdmin = IsAdminRole(GetUserRoleFromClaims());
            var canEdit = CanEditClubRecord(record, userId, isAdmin);
            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue && record.Id != tenantRecordId.Value)
            {
                return Forbid();
            }

            var hasOverlap = await _context.BilliardClubBookings.AnyAsync(b =>
                b.TableId == table.Id
                && (b.Status ?? string.Empty).ToLower() != "cancelled"
                && b.StartTime < dto.EndTime
                && b.EndTime > dto.StartTime);

            if (hasOverlap)
            {
                return BadRequest("Table already has a booking in that time range");
            }

            var booking = new BilliardClubBooking
            {
                Id = Guid.NewGuid(),
                RecordId = record.Id,
                LocationId = table.Location.Id,
                TableId = table.Id,
                CreatedByUserId = userId,
                CustomerName = dto.CustomerName ?? string.Empty,
                CustomerEmail = dto.CustomerEmail ?? string.Empty,
                CustomerPhone = dto.CustomerPhone ?? string.Empty,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Status = canEdit ? NormalizeBookingStatus(dto.Status) : "pending",
                Notes = dto.Notes ?? string.Empty,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.BilliardClubBookings.Add(booking);
            await _context.SaveChangesAsync();

            return Ok(new BookingResponseDto
            {
                Id = booking.Id,
                RecordId = booking.RecordId,
                LocationId = booking.LocationId,
                TableId = booking.TableId,
                LocationName = table.Location.Name ?? string.Empty,
                TableName = table.Name ?? string.Empty,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                StartTime = booking.StartTime,
                EndTime = booking.EndTime,
                Status = booking.Status,
                Notes = booking.Notes,
                CreatedByUserId = booking.CreatedByUserId,
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return StatusCode(500, "Error creating booking");
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult<BookingResponseDto>> UpdateBooking(Guid id, [FromBody] BookingUpdateDto dto)
    {
        try
        {
            var booking = await _context.BilliardClubBookings
                .Include(b => b.Location)
                .Include(b => b.Table)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var record = await _context.BilliardClubRecords
                .Include(r => r.CoOwners)
                .FirstOrDefaultAsync(r => r.Id == booking.RecordId);

            if (record == null)
            {
                return NotFound("Club record not found");
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

            var newStart = dto.StartTime ?? booking.StartTime;
            var newEnd = dto.EndTime ?? booking.EndTime;
            if (newStart >= newEnd)
            {
                return BadRequest("End time must be after start time");
            }

            var hasOverlap = await _context.BilliardClubBookings.AnyAsync(b =>
                b.Id != booking.Id
                && b.TableId == booking.TableId
                && (b.Status ?? string.Empty).ToLower() != "cancelled"
                && b.StartTime < newEnd
                && b.EndTime > newStart);

            if (hasOverlap)
            {
                return BadRequest("Table already has a booking in that time range");
            }

            booking.CustomerName = dto.CustomerName ?? booking.CustomerName;
            booking.CustomerEmail = dto.CustomerEmail ?? booking.CustomerEmail;
            booking.CustomerPhone = dto.CustomerPhone ?? booking.CustomerPhone;
            booking.StartTime = newStart;
            booking.EndTime = newEnd;
            booking.Status = NormalizeBookingStatus(dto.Status ?? booking.Status);
            booking.Notes = dto.Notes ?? booking.Notes;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new BookingResponseDto
            {
                Id = booking.Id,
                RecordId = booking.RecordId,
                LocationId = booking.LocationId,
                TableId = booking.TableId,
                LocationName = booking.Location?.Name ?? string.Empty,
                TableName = booking.Table?.Name ?? string.Empty,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                StartTime = booking.StartTime,
                EndTime = booking.EndTime,
                Status = booking.Status,
                Notes = booking.Notes,
                CreatedByUserId = booking.CreatedByUserId,
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking");
            return StatusCode(500, "Error updating booking");
        }
    }

    [HttpPut("mine/{id}")]
    [Authorize]
    public async Task<ActionResult<BookingResponseDto>> UpdateMyBooking(Guid id, [FromBody] BookingMyUpdateDto dto)
    {
        try
        {
            var booking = await _context.BilliardClubBookings
                .Include(b => b.Location)
                .Include(b => b.Table)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            if (booking.CreatedByUserId != userId)
            {
                return Forbid();
            }

            var status = (booking.Status ?? string.Empty).ToLower();
            if (status == "completed")
            {
                return BadRequest("Completed bookings cannot be edited");
            }

            var newStart = dto.StartTime ?? booking.StartTime;
            var newEnd = dto.EndTime ?? booking.EndTime;
            if (newStart >= newEnd)
            {
                return BadRequest("End time must be after start time");
            }

            var hasOverlap = await _context.BilliardClubBookings.AnyAsync(b =>
                b.Id != booking.Id
                && b.TableId == booking.TableId
                && (b.Status ?? string.Empty).ToLower() != "cancelled"
                && b.StartTime < newEnd
                && b.EndTime > newStart);

            if (hasOverlap)
            {
                return BadRequest("Table already has a booking in that time range");
            }

            booking.CustomerName = dto.CustomerName ?? booking.CustomerName;
            booking.CustomerEmail = dto.CustomerEmail ?? booking.CustomerEmail;
            booking.CustomerPhone = dto.CustomerPhone ?? booking.CustomerPhone;
            booking.StartTime = newStart;
            booking.EndTime = newEnd;
            booking.Status = "pending";
            booking.Notes = dto.Notes ?? booking.Notes;
            booking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new BookingResponseDto
            {
                Id = booking.Id,
                RecordId = booking.RecordId,
                LocationId = booking.LocationId,
                TableId = booking.TableId,
                LocationName = booking.Location?.Name ?? string.Empty,
                TableName = booking.Table?.Name ?? string.Empty,
                CustomerName = booking.CustomerName,
                CustomerEmail = booking.CustomerEmail,
                CustomerPhone = booking.CustomerPhone,
                StartTime = booking.StartTime,
                EndTime = booking.EndTime,
                Status = booking.Status,
                Notes = booking.Notes,
                CreatedByUserId = booking.CreatedByUserId,
                CreatedAt = booking.CreatedAt,
                UpdatedAt = booking.UpdatedAt
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating my booking");
            return StatusCode(500, "Error updating booking");
        }
    }

    [HttpPost("mine/{id}/cancel")]
    [Authorize]
    public async Task<ActionResult> CancelMyBooking(Guid id)
    {
        try
        {
            var booking = await _context.BilliardClubBookings.FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            if (booking.CreatedByUserId != userId)
            {
                return Forbid();
            }

            var status = (booking.Status ?? string.Empty).ToLower();
            if (status == "completed" || status == "cancelled")
            {
                return BadRequest($"Cannot cancel a booking that is already {status}");
            }

            booking.Status = "cancelled";
            booking.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling booking {Id}", id);
            return StatusCode(500, "Error cancelling booking");
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
    public async Task<ActionResult> DeleteBooking(Guid id)
    {
        try
        {
            var booking = await _context.BilliardClubBookings.FirstOrDefaultAsync(b => b.Id == id);
            if (booking == null)
            {
                return NotFound();
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var record = await _context.BilliardClubRecords
                .Include(r => r.CoOwners)
                .FirstOrDefaultAsync(r => r.Id == booking.RecordId);

            if (record == null)
            {
                return NotFound("Club record not found");
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

            _context.BilliardClubBookings.Remove(booking);
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting booking");
            return StatusCode(500, "Error deleting booking");
        }
    }

    [HttpGet("availability")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingAvailabilityDto>>> GetBookingAvailability([FromQuery] Guid tableId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        try
        {
            if (tableId == Guid.Empty)
            {
                return BadRequest("TableId is required");
            }

            if (from >= to)
            {
                return BadRequest("Invalid time range");
            }

            var bookings = await _context.BilliardClubBookings
                .Where(b => b.TableId == tableId
                    && (b.Status ?? string.Empty).ToLower() != "cancelled"
                    && b.StartTime < to
                    && b.EndTime > from)
                .OrderBy(b => b.StartTime)
                .Select(b => new BookingAvailabilityDto
                {
                    StartTime = b.StartTime,
                    EndTime = b.EndTime
                })
                .ToListAsync();

            return Ok(bookings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting booking availability");
            return StatusCode(500, "Error retrieving booking availability");
        }
    }

    [HttpGet("mine")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<BookingResponseDto>>> GetMyBookings()
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("User authentication failed");
            }

            var bookings = await _context.BilliardClubBookings
                .Include(b => b.Location)
                .Include(b => b.Table)
                .Where(b => b.CreatedByUserId == userId)
                .OrderByDescending(b => b.StartTime)
                .ToListAsync();

            var tenantRecordId = GetTenantRecordId();
            if (tenantRecordId.HasValue)
            {
                bookings = bookings.Where(b => b.RecordId == tenantRecordId.Value).ToList();
            }

            var result = bookings.Select(b => new BookingResponseDto
            {
                Id = b.Id,
                RecordId = b.RecordId,
                LocationId = b.LocationId,
                TableId = b.TableId,
                LocationName = b.Location?.Name ?? string.Empty,
                TableName = b.Table?.Name ?? string.Empty,
                CustomerName = b.CustomerName,
                CustomerEmail = b.CustomerEmail,
                CustomerPhone = b.CustomerPhone,
                StartTime = b.StartTime,
                EndTime = b.EndTime,
                Status = b.Status,
                Notes = b.Notes,
                CreatedByUserId = b.CreatedByUserId,
                CreatedAt = b.CreatedAt,
                UpdatedAt = b.UpdatedAt
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting my bookings");
            return StatusCode(500, "Error retrieving bookings");
        }
    }
}

public class BookingCreateDto
{
    public Guid TableId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class BookingUpdateDto
{
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class BookingMyUpdateDto
{
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public DateTime? StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public string? Notes { get; set; }
}

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public Guid RecordId { get; set; }
    public Guid LocationId { get; set; }
    public Guid TableId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string TableName { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class BookingAvailabilityDto
{
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
}
