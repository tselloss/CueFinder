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
[Route("api/sessions")]
[Authorize(Roles = "admin,club_owner,clubowner,club owner,owner")]
public class SessionsController : ControllerBase
{
    private readonly BookingDbContext _context;
    private readonly CueFinderDbContext _dbContext;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(BookingDbContext context, CueFinderDbContext dbContext, ILogger<SessionsController> logger)
    {
        _context = context;
        _dbContext = dbContext;
        _logger = logger;
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var guidId))
            return guidId;
        if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out _))
        {
            using var md5 = MD5.Create();
            var hash = md5.ComputeHash(Encoding.UTF8.GetBytes(userIdClaim));
            return new Guid(hash);
        }
        return Guid.Empty;
    }

    private static bool IsAdminRole(string role) =>
        string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase);

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
                if (string.IsNullOrWhiteSpace(email)) email = userProfile.Email ?? string.Empty;
                if (string.IsNullOrWhiteSpace(username)) username = userProfile.Username ?? string.Empty;
            }
        }

        return (email ?? string.Empty, username ?? string.Empty);
    }

    private async Task<List<Guid>> GetEditableRecordIdsAsync(Guid userId, bool isAdmin)
    {
        if (isAdmin)
            return await _context.BilliardClubRecords.Select(r => r.Id).ToListAsync();

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

    /// <summary>
    /// GET /api/sessions/live?recordId=X
    /// Returns all tables for the club with their current live status:
    /// free | occupied (active walk-in session) | reserved (confirmed booking now or within 60 min)
    /// </summary>
    [HttpGet("live")]
    public async Task<ActionResult<IEnumerable<LiveTableDto>>> GetLiveStatus([FromQuery] Guid? recordId)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User authentication failed");

            var isAdmin = IsAdminRole(User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
            var editableIds = await GetEditableRecordIdsAsync(userId, isAdmin);
            if (!isAdmin && editableIds.Count == 0)
                return Ok(new List<LiveTableDto>());

            var now = DateTime.UtcNow;
            var soonCutoff = now.AddMinutes(60);

            // Load locations + tables for accessible records
            var locationsQuery = _context.BilliardClubLocations
                .Include(l => l.Tables)
                .Where(l => isAdmin || editableIds.Contains(l.RecordId));

            if (recordId.HasValue)
                locationsQuery = locationsQuery.Where(l => l.RecordId == recordId.Value);

            var locations = await locationsQuery.ToListAsync();
            var tableIds = locations.SelectMany(l => l.Tables).Select(t => t.Id).ToList();

            // Default rates per record
            var recordIds = locations.Select(l => l.RecordId).Distinct().ToList();
            var defaultRates = await _context.BilliardClubRecords
                .Where(r => recordIds.Contains(r.Id))
                .Select(r => new { r.Id, r.DefaultHourlyRate })
                .ToDictionaryAsync(r => r.Id, r => r.DefaultHourlyRate);

            // Active sessions (no EndedAt)
            var activeSessions = await _context.TableSessions
                .Where(s => tableIds.Contains(s.TableId) && s.EndedAt == null)
                .ToListAsync();

            // Confirmed bookings active right now or starting within 60 min
            var relevantBookings = await _context.BilliardClubBookings
                .Where(b =>
                    tableIds.Contains(b.TableId)
                    && (b.Status == "confirmed" || b.Status == "pending")
                    && b.StartTime <= soonCutoff
                    && b.EndTime > now)
                .OrderBy(b => b.StartTime)
                .ToListAsync();

            var result = new List<LiveTableDto>();

            foreach (var loc in locations)
            {
                foreach (var table in loc.Tables)
                {
                    var activeSession = activeSessions.FirstOrDefault(s => s.TableId == table.Id);
                    var nextBooking = relevantBookings.FirstOrDefault(b => b.TableId == table.Id);

                    string status;
                    string? customerName = null;
                    DateTime? sessionStart = null;
                    Guid? activeSessionId = null;
                    decimal? hourlyRate = null;
                    string? bookingCustomer = null;
                    DateTime? bookingStart = null;
                    DateTime? bookingEnd = null;

                    var defaultRecordRate = defaultRates.TryGetValue(loc.RecordId, out var dr) ? dr : null;
                    var effectiveTableRate = table.HourlyRate ?? defaultRecordRate;

                    if (activeSession != null)
                    {
                        status = "occupied";
                        customerName = activeSession.CustomerName;
                        sessionStart = activeSession.StartedAt;
                        activeSessionId = activeSession.Id;
                        hourlyRate = activeSession.HourlyRate ?? effectiveTableRate;
                    }
                    else if (nextBooking != null && nextBooking.StartTime <= now)
                    {
                        status = "reserved";
                        bookingCustomer = nextBooking.CustomerName;
                        bookingStart = nextBooking.StartTime;
                        bookingEnd = nextBooking.EndTime;
                        hourlyRate = effectiveTableRate;
                    }
                    else if (nextBooking != null)
                    {
                        status = "reserved_soon";
                        bookingCustomer = nextBooking.CustomerName;
                        bookingStart = nextBooking.StartTime;
                        bookingEnd = nextBooking.EndTime;
                        hourlyRate = effectiveTableRate;
                    }
                    else
                    {
                        status = "free";
                        hourlyRate = effectiveTableRate;
                    }

                    result.Add(new LiveTableDto
                    {
                        TableId = table.Id,
                        TableName = table.Name,
                        TableNotes = table.Notes,
                        HourlyRate = hourlyRate,
                        LocationId = loc.Id,
                        LocationName = loc.Name,
                        RecordId = loc.RecordId,
                        Status = status,
                        CustomerName = customerName,
                        SessionStart = sessionStart,
                        ActiveSessionId = activeSessionId,
                        BookingCustomer = bookingCustomer,
                        BookingStart = bookingStart,
                        BookingEnd = bookingEnd
                    });
                }
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting live table status");
            return StatusCode(500, "Error retrieving live status");
        }
    }

    /// <summary>
    /// POST /api/sessions — Start a walk-in session on a table
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SessionResponseDto>> StartSession([FromBody] StartSessionDto dto)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User authentication failed");

            var table = await _context.BilliardClubTables
                .Include(t => t.Location)
                .FirstOrDefaultAsync(t => t.Id == dto.TableId);

            if (table?.Location == null)
                return NotFound("Table not found");

            var clubRecord = await _context.BilliardClubRecords
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == table.Location.RecordId);

            var isAdmin = IsAdminRole(User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
            var editableIds = await GetEditableRecordIdsAsync(userId, isAdmin);
            if (!isAdmin && !editableIds.Contains(table.Location.RecordId))
                return Forbid();

            // Check no active session already running on this table
            var existing = await _context.TableSessions
                .AnyAsync(s => s.TableId == dto.TableId && s.EndedAt == null);
            if (existing)
                return BadRequest("Table already has an active session");

            var now = DateTime.UtcNow;

            // Also check no confirmed booking overlapping with right now
            var bookingConflict = await _context.BilliardClubBookings.AnyAsync(b =>
                b.TableId == dto.TableId
                && (b.Status == "confirmed")
                && b.StartTime <= now
                && b.EndTime > now);
            if (bookingConflict)
                return BadRequest("Table has a confirmed booking right now");

            var session = new TableSession
            {
                Id = Guid.NewGuid(),
                TableId = dto.TableId,
                LocationId = table.Location.Id,
                RecordId = table.Location.RecordId,
                CustomerName = dto.CustomerName ?? string.Empty,
                HourlyRate = dto.HourlyRate ?? table.HourlyRate ?? clubRecord?.DefaultHourlyRate,
                StartedAt = now,
                StartedByUserId = userId,
                CreatedAt = now
            };

            _context.TableSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(MapSession(session, table.Name));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error starting session");
            return StatusCode(500, "Error starting session");
        }
    }

    /// <summary>
    /// PUT /api/sessions/{id}/end — End a walk-in session, calculate bill
    /// </summary>
    [HttpPut("{id}/end")]
    public async Task<ActionResult<SessionResponseDto>> EndSession(Guid id)
    {
        try
        {
            var session = await _context.TableSessions
                .Include(s => s.Table)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (session == null)
                return NotFound();

            if (session.EndedAt != null)
                return BadRequest("Session already ended");

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User authentication failed");

            var isAdmin = IsAdminRole(User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
            var editableIds = await GetEditableRecordIdsAsync(userId, isAdmin);
            if (!isAdmin && !editableIds.Contains(session.RecordId))
                return Forbid();

            var now = DateTime.UtcNow;
            var minutes = (int)Math.Ceiling((now - session.StartedAt).TotalMinutes);
            var cost = session.HourlyRate.HasValue
                ? Math.Round(session.HourlyRate.Value * minutes / 60m, 2)
                : (decimal?)null;

            session.EndedAt = now;
            session.TotalMinutes = minutes;
            session.TotalCost = cost;

            await _context.SaveChangesAsync();

            return Ok(MapSession(session, session.Table?.Name ?? string.Empty));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error ending session {Id}", id);
            return StatusCode(500, "Error ending session");
        }
    }

    /// <summary>
    /// GET /api/sessions/history?recordId=X&tableId=Y — Past sessions for a club
    /// </summary>
    [HttpGet("history")]
    public async Task<ActionResult<IEnumerable<SessionResponseDto>>> GetHistory(
        [FromQuery] Guid? recordId,
        [FromQuery] Guid? tableId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User authentication failed");

            var isAdmin = IsAdminRole(User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
            var editableIds = await GetEditableRecordIdsAsync(userId, isAdmin);

            var query = _context.TableSessions
                .Include(s => s.Table)
                .Where(s => (isAdmin || editableIds.Contains(s.RecordId)) && s.EndedAt != null);

            if (recordId.HasValue)
                query = query.Where(s => s.RecordId == recordId.Value);
            if (tableId.HasValue)
                query = query.Where(s => s.TableId == tableId.Value);

            var sessions = await query
                .OrderByDescending(s => s.StartedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(sessions.Select(s => MapSession(s, s.Table?.Name ?? string.Empty)));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session history");
            return StatusCode(500, "Error retrieving session history");
        }
    }

    /// <summary>
    /// GET /api/sessions/stats?recordId=X — Revenue and session counts for a club
    /// </summary>
    [HttpGet("stats")]
    public async Task<ActionResult> GetStats([FromQuery] Guid? recordId)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
                return Unauthorized("User authentication failed");

            var isAdmin = IsAdminRole(User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
            var editableIds = await GetEditableRecordIdsAsync(userId, isAdmin);

            var todayStart = DateTime.UtcNow.Date;
            var weekStart = todayStart.AddDays(-6);
            var monthStart = new DateTime(todayStart.Year, todayStart.Month, 1);

            var completedQuery = _context.TableSessions
                .Where(s => (isAdmin || editableIds.Contains(s.RecordId)) && s.EndedAt != null);

            var activeCount = await _context.TableSessions
                .CountAsync(s =>
                    (isAdmin || editableIds.Contains(s.RecordId))
                    && s.EndedAt == null
                    && (!recordId.HasValue || s.RecordId == recordId.Value));

            if (recordId.HasValue)
                completedQuery = completedQuery.Where(s => s.RecordId == recordId.Value);

            var todaySessions = await completedQuery
                .Where(s => s.EndedAt >= todayStart)
                .Select(s => new { s.TotalCost })
                .ToListAsync();

            var weekSessions = await completedQuery
                .Where(s => s.EndedAt >= weekStart)
                .Select(s => new { s.TotalCost })
                .ToListAsync();

            var monthSessions = await completedQuery
                .Where(s => s.EndedAt >= monthStart)
                .Select(s => new { s.TotalCost })
                .ToListAsync();

            return Ok(new
            {
                activeSessions = activeCount,
                todayCompleted = todaySessions.Count,
                todayRevenue = todaySessions.Sum(s => s.TotalCost ?? 0m),
                weekRevenue = weekSessions.Sum(s => s.TotalCost ?? 0m),
                monthRevenue = monthSessions.Sum(s => s.TotalCost ?? 0m)
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting session stats");
            return StatusCode(500, "Error retrieving session stats");
        }
    }

    private static SessionResponseDto MapSession(TableSession s, string tableName) => new()
    {
        Id = s.Id,
        TableId = s.TableId,
        TableName = tableName,
        LocationId = s.LocationId,
        RecordId = s.RecordId,
        CustomerName = s.CustomerName,
        HourlyRate = s.HourlyRate,
        StartedAt = s.StartedAt,
        EndedAt = s.EndedAt,
        TotalMinutes = s.TotalMinutes,
        TotalCost = s.TotalCost,
        StartedByUserId = s.StartedByUserId,
        CreatedAt = s.CreatedAt
    };
}

public class StartSessionDto
{
    public Guid TableId { get; set; }
    public string? CustomerName { get; set; }
    public decimal? HourlyRate { get; set; }
}

public class SessionResponseDto
{
    public Guid Id { get; set; }
    public Guid TableId { get; set; }
    public string TableName { get; set; } = string.Empty;
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

public class LiveTableDto
{
    public Guid TableId { get; set; }
    public string TableName { get; set; } = string.Empty;
    public string TableNotes { get; set; } = string.Empty;
    public decimal? HourlyRate { get; set; }
    public Guid LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public Guid RecordId { get; set; }

    // free | occupied | reserved | reserved_soon
    public string Status { get; set; } = "free";

    // Occupied (walk-in session)
    public string? CustomerName { get; set; }
    public DateTime? SessionStart { get; set; }
    public Guid? ActiveSessionId { get; set; }

    // Reserved (from bookings)
    public string? BookingCustomer { get; set; }
    public DateTime? BookingStart { get; set; }
    public DateTime? BookingEnd { get; set; }
}
