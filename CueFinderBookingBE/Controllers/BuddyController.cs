using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CueFinderBookingBE.Data;
using CueFinderBookingBE.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CueFinderBookingBE.Controllers;

[ApiController]
[Route("api/buddy")]
public class BuddyController : ControllerBase
{
    private readonly BookingDbContext _context;
    private readonly ILogger<BuddyController> _logger;

    public BuddyController(BookingDbContext context, ILogger<BuddyController> logger)
    {
        _context = context;
        _logger = logger;
    }

    public record BuddyPostCreateDto(string? LocationName, DateTime PlayDate, string StartTime, string SkillLevel, string? Notes);
    public record BuddyRequestCreateDto(string SkillLevel, string? Message);
    public record BuddyReviewDto(int Score, string? Note);

    private Guid GetUserIdFromClaims()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(claim) && Guid.TryParse(claim, out var guid)) return guid;
        if (!string.IsNullOrWhiteSpace(claim) && int.TryParse(claim, out _))
        {
            using var md5 = MD5.Create();
            return new Guid(md5.ComputeHash(Encoding.UTF8.GetBytes(claim)));
        }
        return Guid.Empty;
    }

    private string GetUserName() =>
        User.FindFirst(ClaimTypes.Name)?.Value
        ?? User.FindFirst("unique_name")?.Value
        ?? User.FindFirst("name")?.Value
        ?? User.Identity?.Name
        ?? "Player";

    // GET /api/buddy — public browse
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetPosts([FromQuery] string? level, [FromQuery] string? locationName)
    {
        var query = _context.BuddyPosts
            .Where(p => p.Status == "open");

        if (!string.IsNullOrWhiteSpace(level))
            query = query.Where(p => p.SkillLevel == level.ToLowerInvariant());

        if (!string.IsNullOrWhiteSpace(locationName))
            query = query.Where(p => p.LocationName == locationName);

        var posts = await query
            .OrderByDescending(p => p.PlayDate)
            .Select(p => new
            {
                id = p.Id,
                userId = p.UserId,
                userName = p.UserName,
                locationName = p.LocationName,
                playDate = p.PlayDate,
                startTime = p.StartTime,
                skillLevel = p.SkillLevel,
                notes = p.Notes,
                status = p.Status,
                createdAt = p.CreatedAt,
                requestCount = p.Requests.Count(r => r.Status == "pending")
            })
            .ToListAsync();

        return Ok(posts);
    }

    // GET /api/buddy/mine — my posts with their requests
    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> GetMyPosts()
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty) return Unauthorized();

        var posts = await _context.BuddyPosts
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                id = p.Id,
                locationName = p.LocationName,
                playDate = p.PlayDate,
                startTime = p.StartTime,
                skillLevel = p.SkillLevel,
                notes = p.Notes,
                status = p.Status,
                createdAt = p.CreatedAt,
                requests = p.Requests.Select(r => new
                {
                    id = r.Id,
                    requesterId = r.RequesterId,
                    requesterName = r.RequesterName,
                    skillLevel = r.SkillLevel,
                    message = r.Message,
                    status = r.Status,
                    reviewScore = r.ReviewScore,
                    reviewNote = r.ReviewNote,
                    createdAt = r.CreatedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(posts);
    }

    // GET /api/buddy/my-requests — requests I sent
    [HttpGet("my-requests")]
    [Authorize]
    public async Task<IActionResult> GetMyRequests()
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty) return Unauthorized();

        var requests = await _context.BuddyRequests
            .Where(r => r.RequesterId == userId)
            .Include(r => r.BuddyPost)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                id = r.Id,
                skillLevel = r.SkillLevel,
                message = r.Message,
                status = r.Status,
                reviewScore = r.ReviewScore,
                reviewNote = r.ReviewNote,
                createdAt = r.CreatedAt,
                post = new
                {
                    id = r.BuddyPost!.Id,
                    userName = r.BuddyPost.UserName,
                    locationName = r.BuddyPost.LocationName,
                    playDate = r.BuddyPost.PlayDate,
                    startTime = r.BuddyPost.StartTime,
                    skillLevel = r.BuddyPost.SkillLevel,
                    status = r.BuddyPost.Status
                }
            })
            .ToListAsync();

        return Ok(requests);
    }

    // POST /api/buddy — create a post
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreatePost([FromBody] BuddyPostCreateDto dto)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty) return Unauthorized();

        var post = new BuddyPost
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            UserName = GetUserName(),
            LocationName = dto.LocationName?.Trim(),
            PlayDate = dto.PlayDate,
            StartTime = (dto.StartTime ?? "").Trim(),
            SkillLevel = (dto.SkillLevel ?? "beginner").ToLowerInvariant(),
            Notes = dto.Notes?.Trim(),
            Status = "open",
            CreatedAt = DateTime.UtcNow
        };

        _context.BuddyPosts.Add(post);
        await _context.SaveChangesAsync();
        return Ok(new { id = post.Id });
    }

    // DELETE /api/buddy/{id}
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeletePost(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var post = await _context.BuddyPosts.FindAsync(id);
        if (post == null) return NotFound();
        if (post.UserId != userId) return Forbid();

        _context.BuddyPosts.Remove(post);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/buddy/{id}/close
    [HttpPost("{id:guid}/close")]
    [Authorize]
    public async Task<IActionResult> ClosePost(Guid id)
    {
        var userId = GetUserIdFromClaims();
        var post = await _context.BuddyPosts.FindAsync(id);
        if (post == null) return NotFound();
        if (post.UserId != userId) return Forbid();

        post.Status = "closed";
        await _context.SaveChangesAsync();
        return Ok();
    }

    // POST /api/buddy/{id}/request — send a join request
    [HttpPost("{id:guid}/request")]
    [Authorize]
    public async Task<IActionResult> SendRequest(Guid id, [FromBody] BuddyRequestCreateDto dto)
    {
        var userId = GetUserIdFromClaims();
        if (userId == Guid.Empty) return Unauthorized();

        var post = await _context.BuddyPosts.FindAsync(id);
        if (post == null) return NotFound();
        if (post.UserId == userId) return BadRequest("Cannot request on your own post.");
        if (post.Status != "open") return BadRequest("This post is no longer open.");

        var alreadySent = await _context.BuddyRequests.AnyAsync(r => r.BuddyPostId == id && r.RequesterId == userId);
        if (alreadySent) return BadRequest("You already sent a request for this post.");

        var request = new BuddyRequest
        {
            Id = Guid.NewGuid(),
            BuddyPostId = id,
            RequesterId = userId,
            RequesterName = GetUserName(),
            SkillLevel = (dto.SkillLevel ?? "beginner").ToLowerInvariant(),
            Message = dto.Message?.Trim(),
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.BuddyRequests.Add(request);
        await _context.SaveChangesAsync();
        return Ok(new { id = request.Id });
    }

    // POST /api/buddy/{id}/requests/{requestId}/accept
    [HttpPost("{id:guid}/requests/{requestId:guid}/accept")]
    [Authorize]
    public async Task<IActionResult> AcceptRequest(Guid id, Guid requestId)
    {
        var userId = GetUserIdFromClaims();
        var post = await _context.BuddyPosts.Include(p => p.Requests).FirstOrDefaultAsync(p => p.Id == id);
        if (post == null) return NotFound();
        if (post.UserId != userId) return Forbid();

        var req = post.Requests.FirstOrDefault(r => r.Id == requestId);
        if (req == null) return NotFound();

        req.Status = "accepted";
        post.Status = "matched";

        foreach (var other in post.Requests.Where(r => r.Id != requestId && r.Status == "pending"))
            other.Status = "declined";

        await _context.SaveChangesAsync();
        return Ok();
    }

    // POST /api/buddy/{id}/requests/{requestId}/decline
    [HttpPost("{id:guid}/requests/{requestId:guid}/decline")]
    [Authorize]
    public async Task<IActionResult> DeclineRequest(Guid id, Guid requestId)
    {
        var userId = GetUserIdFromClaims();
        var post = await _context.BuddyPosts.FindAsync(id);
        if (post == null) return NotFound();
        if (post.UserId != userId) return Forbid();

        var req = await _context.BuddyRequests.FindAsync(requestId);
        if (req == null || req.BuddyPostId != id) return NotFound();

        req.Status = "declined";
        await _context.SaveChangesAsync();
        return Ok();
    }

    // POST /api/buddy/{id}/requests/{requestId}/review
    [HttpPost("{id:guid}/requests/{requestId:guid}/review")]
    [Authorize]
    public async Task<IActionResult> ReviewRequester(Guid id, Guid requestId, [FromBody] BuddyReviewDto dto)
    {
        var userId = GetUserIdFromClaims();
        var post = await _context.BuddyPosts.FindAsync(id);
        if (post == null) return NotFound();
        if (post.UserId != userId) return Forbid();

        var req = await _context.BuddyRequests.FindAsync(requestId);
        if (req == null || req.BuddyPostId != id) return NotFound();
        if (req.Status != "accepted") return BadRequest("Can only review an accepted match.");

        req.ReviewScore = Math.Clamp(dto.Score, 1, 5);
        req.ReviewNote = dto.Note?.Trim();
        await _context.SaveChangesAsync();
        return Ok();
    }
}
