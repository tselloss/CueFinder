using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using CueFinder.Extensions.Moderation;
using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Extensions.Controllers
{
    /// <summary>
    /// API endpoints for image moderation
    /// </summary>
    [ApiController]
    // Use an explicit prefix to avoid clashing with the app-level moderation controller
    [Route("api/ext/[controller]")]
    public class ModerationController : ControllerBase
    {
        private readonly IModerationService _moderationService;
        private readonly CueFinderDbContext _context;
        private readonly ILogger<ModerationController> _logger;
        private readonly IWebHostEnvironment _hostEnvironment;

        public ModerationController(
            IModerationService moderationService,
            CueFinderDbContext context,
            ILogger<ModerationController> logger,
            IWebHostEnvironment hostEnvironment)
        {
            _moderationService = moderationService;
            _context = context;
            _logger = logger;
            _hostEnvironment = hostEnvironment;
        }

        /// <summary>
        /// Upload image with moderation check
        /// </summary>
        [HttpPost("upload-image")]
        [Authorize]
        public async Task<IActionResult> UploadImage([FromForm] IFormFile file, [FromQuery] int? cueId = null, [FromQuery] int? cueCaseId = null)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "No file provided" });

            // Get user ID from claims (handle standard and JWT "sub")
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                               ?? User.FindFirst("sub")?.Value
                               ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid user context" });

            // Validate file type
            var allowedMimes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
            var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedMimes.Contains(contentType) && !allowedExtensions.Contains(extension))
                return BadRequest(new { message = "Invalid file type. Allowed: JPEG, PNG, WebP, GIF" });

            // Validate file size (5MB max)
            if (file.Length > 5 * 1024 * 1024)
                return BadRequest(new { message = "File too large. Maximum 5MB" });

            try
            {
                // Save to temporary location
                var uploadsDir = Path.Combine(_hostEnvironment.ContentRootPath, "uploads", "temp");
                Directory.CreateDirectory(uploadsDir);

                var filename = $"{Guid.NewGuid()}_{file.FileName}";
                var tempPath = Path.Combine(uploadsDir, filename);

                using (var stream = new FileStream(tempPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Scan image for inappropriate content
                var scanResult = await _moderationService.ScanImageAsync(tempPath, userId, cueId, cueCaseId);

                if (scanResult.IsUnsafe)
                {
                    // Retain file (ScanImageAsync may move it to uploads/flagged); return 403
                    return new ObjectResult(new
                    {
                        message = "Image rejected - violates content policy",
                        flag_reason = scanResult.FlagReason,
                        confidence = scanResult.ConfidenceScore
                    })
                    {
                        StatusCode = 403
                    };
                }

                // Image passed moderation - move to public storage and attach to cue/case
                var imageUrlBase = _configuration["ImageStorage:ImageUrlBase"] ?? "/uploads/cues";
                var storagePath = _configuration["ImageStorage:StoragePath"] ?? "uploads/cues";

                string publicImageUrl = "";

                if (cueId.HasValue)
                {
                    // Move to cue's folder
                    var publicCueFolder = Path.Combine(_hostEnvironment.ContentRootPath, storagePath, cueId.Value.ToString());
                    Directory.CreateDirectory(publicCueFolder);

                    var newFilePath = Path.Combine(publicCueFolder, filename);
                    System.IO.File.Move(tempPath, newFilePath);

                    publicImageUrl = $"{imageUrlBase}/{cueId.Value}/{filename}";

                    // Attach to cue
                    var cueImage = new CueFinder.Database.Models.CueImage
                    {
                        CueId = cueId.Value,
                        ImageUrl = publicImageUrl,
                        AltText = $"Cue image {filename}",
                        DisplayOrder = 0,
                        IsPrimary = false,
                        UploadedAt = DateTime.UtcNow,
                        ContentType = file.ContentType ?? "image/jpeg"
                    };
                    _context.CueImages.Add(cueImage);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Image uploaded and attached to Cue {cueId.Value}: {publicImageUrl}");
                }
                else if (cueCaseId.HasValue)
                {
                    // Move to case's folder
                    var publicCaseFolder = Path.Combine(_hostEnvironment.ContentRootPath, "uploads", "cases", cueCaseId.Value.ToString());
                    Directory.CreateDirectory(publicCaseFolder);

                    var newFilePath = Path.Combine(publicCaseFolder, filename);
                    System.IO.File.Move(tempPath, newFilePath);

                    publicImageUrl = $"/uploads/cases/{cueCaseId.Value}/{filename}";

                    // Attach to case
                    var caseImage = new CueFinder.Database.Models.CueCaseImage
                    {
                        CueCaseId = cueCaseId.Value,
                        ImageUrl = publicImageUrl,
                        DisplayOrder = 0,
                        IsPrimary = false,
                        UploadedAt = DateTime.UtcNow
                    };
                    _context.CueCaseImages.Add(caseImage);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Image uploaded and attached to CueCase {cueCaseId.Value}: {publicImageUrl}");
                }

                return Ok(new
                {
                    message = "Image uploaded and approved successfully",
                    filename = filename,
                    url = publicImageUrl,
                    size = file.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading image");
                return StatusCode(500, new { message = "Upload failed" });
            }
        }

        /// <summary>
        /// [ADMIN] Get pending moderation items
        /// </summary>
        [HttpGet("pending")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetPendingFlags([FromQuery] int limit = 50)
        {
            var flags = await _moderationService.GetPendingFlagsAsync(limit);
            return Ok(new
            {
                total = flags.Count,
                items = flags.Select(f => new
                {
                    id = f.Id,
                    reason = f.FlagReason,
                    confidence = f.AIConfidenceScore,
                    is_ai = f.IsAIFlagged,
                    user_id = f.UserId,
                    user_name = f.User?.Username,
                    cue_id = f.CueId,
                    cue_case_id = f.CueCaseId,
                    flagged_at = f.FlaggedAt,
                    storage_path = f.StoragePath
                })
            });
        }

        /// <summary>
        /// [ADMIN] Get all flagged images with user information
        /// </summary>
        [HttpGet("flagged-images")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllFlaggedImages(
            [FromQuery] string? status = null,
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            var query = _context.FlaggedImages
                .Include(f => f.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(f => f.Status == status);
            }

            var total = await query.CountAsync();
            var flags = await query
                .OrderByDescending(f => f.FlaggedAt)
                .Skip(skip)
                .Take(take)
                .Select(f => new
                {
                    id = f.Id,
                    user_id = f.UserId,
                    user_name = f.User != null ? f.User.Username : "Unknown",
                    user_email = f.User != null ? f.User.Email : null,
                    user_is_banned = f.User != null ? f.User.IsBanned : false,
                    image_hash = f.ImageHash,
                    file_name = f.FileName,
                    storage_path = f.StoragePath,
                    cue_id = f.CueId,
                    cue_case_id = f.CueCaseId,
                    flag_reason = f.FlagReason,
                    ai_confidence = f.AIConfidenceScore,
                    is_ai_flagged = f.IsAIFlagged,
                    status = f.Status,
                    flagged_at = f.FlaggedAt,
                    reviewed_at = f.ReviewedAt,
                    admin_notes = f.AdminNotes
                })
                .ToListAsync();

            return Ok(new
            {
                total,
                skip,
                take,
                items = flags
            });
        }

        /// <summary>
        /// [ADMIN] Get banned users with their flagged content count
        /// </summary>
        [HttpGet("banned-users")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetBannedUsers(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            var bannedUserIds = await _context.Users
                .Where(u => u.IsBanned)
                .Select(u => u.Id)
                .ToListAsync();

            var bannedUsers = await _context.Users
                .Where(u => u.IsBanned)
                .OrderBy(u => u.Id)
                .Skip(skip)
                .Take(take)
                .Select(u => new
                {
                    id = u.Id,
                    username = u.Username,
                    email = u.Email,
                    display_name = u.Name,
                    is_banned = u.IsBanned,
                    created_at = u.CreatedAt,
                    flagged_images_count = _context.FlaggedImages.Count(f => f.UserId == u.Id),
                    rejected_images_count = _context.FlaggedImages.Count(f => f.UserId == u.Id && f.Status == "rejected"),
                    pending_flags_count = _context.FlaggedImages.Count(f => f.UserId == u.Id && f.Status == "pending")
                })
                .ToListAsync();

            var totalBanned = bannedUserIds.Count;

            return Ok(new
            {
                total = totalBanned,
                skip,
                take,
                items = bannedUsers
            });
        }

        /// <summary>
        /// [ADMIN] Get users with flagged content (not necessarily banned)
        /// </summary>
        [HttpGet("users-with-flags")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetUsersWithFlags(
            [FromQuery] int skip = 0,
            [FromQuery] int take = 50)
        {
            // Get user IDs with flagged images, ordered by flag count
            var userIdsWithFlags = await _context.FlaggedImages
                .GroupBy(f => f.UserId)
                .Select(g => new { UserId = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .Skip(skip)
                .Take(take)
                .Select(x => x.UserId)
                .ToListAsync();

            var usersWithFlags = new List<dynamic>();
            foreach (var userId in userIdsWithFlags)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
                if (user == null) continue;

                var totalFlags = await _context.FlaggedImages.CountAsync(f => f.UserId == userId);
                var pendingFlags = await _context.FlaggedImages.CountAsync(f => f.UserId == userId && f.Status == "pending");
                var rejectedFlags = await _context.FlaggedImages.CountAsync(f => f.UserId == userId && f.Status == "rejected");
                var approvedFlags = await _context.FlaggedImages.CountAsync(f => f.UserId == userId && f.Status == "approved");
                var recentFlags = await _context.FlaggedImages
                    .Where(f => f.UserId == userId)
                    .OrderByDescending(f => f.FlaggedAt)
                    .Take(5)
                    .Select(f => new
                    {
                        id = f.Id,
                        reason = f.FlagReason,
                        confidence = f.AIConfidenceScore,
                        status = f.Status,
                        flagged_at = f.FlaggedAt
                    })
                    .ToListAsync();

                usersWithFlags.Add(new
                {
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    display_name = user.Name,
                    is_banned = user.IsBanned,
                    created_at = user.CreatedAt,
                    total_flags = totalFlags,
                    pending_flags = pendingFlags,
                    rejected_flags = rejectedFlags,
                    approved_flags = approvedFlags,
                    flagged_images = recentFlags
                });
            }

            var totalUsersWithFlags = await _context.Users
                .CountAsync(u => _context.FlaggedImages.Any(f => f.UserId == u.Id));

            return Ok(new
            {
                total = totalUsersWithFlags,
                skip,
                take,
                items = usersWithFlags
            });
        }

        /// <summary>
        /// [ADMIN] Get moderation statistics
        /// </summary>
        [HttpGet("stats")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetModerationStats()
        {
            var stats = new
            {
                total_flagged_images = await _context.FlaggedImages.CountAsync(),
                pending_flags = await _context.FlaggedImages.CountAsync(f => f.Status == "pending"),
                approved_flags = await _context.FlaggedImages.CountAsync(f => f.Status == "approved"),
                rejected_flags = await _context.FlaggedImages.CountAsync(f => f.Status == "rejected"),
                total_banned_users = await _context.Users.CountAsync(u => u.IsBanned),
                users_with_flags = await _context.Users.CountAsync(u => _context.FlaggedImages.Any(f => f.UserId == u.Id)),
                ai_flagged_count = await _context.FlaggedImages.CountAsync(f => f.IsAIFlagged),
                user_reported_count = await _context.UserReports.CountAsync(),
                moderation_queue_size = await _context.ModerationQueues.CountAsync(q => !q.IsBeingReviewed),
                high_priority_queue = await _context.ModerationQueues.CountAsync(q => q.Priority == 1 && !q.IsBeingReviewed)
            };

            return Ok(stats);
        }

        /// <summary>
        /// [ADMIN] Approve flagged image
        /// </summary>
        [HttpPost("approve/{flagId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> ApproveFlag(int flagId, [FromBody] ApprovalRequest request)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out var adminUserId))
                return Unauthorized();

            var result = await _moderationService.ApproveFlagAsync(flagId, adminUserId, request?.Notes ?? "");
            if (!result)
                return NotFound(new { message = "Flag not found" });

            return Ok(new { message = "Flag approved" });
        }

        /// <summary>
        /// [ADMIN] Reject flagged image and optionally ban user
        /// </summary>
        [HttpPost("reject/{flagId}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> RejectFlag(int flagId, [FromBody] RejectionRequest request)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out var adminUserId))
                return Unauthorized();

            var result = await _moderationService.RejectFlagAsync(
                flagId, 
                adminUserId, 
                request?.Notes ?? "", 
                request?.BanUser ?? false);

            if (!result)
                return NotFound(new { message = "Flag not found" });

            return Ok(new { message = "Flag rejected" });
        }

        /// <summary>
        /// Report flagged image
        /// </summary>
        [HttpPost("report/{flagId}")]
        [Authorize]
        public async Task<IActionResult> ReportImage(int flagId, [FromBody] ReportRequest request)
        {
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out var reportingUserId))
                return Unauthorized();

            var flaggedImage = await _context.FlaggedImages.FindAsync(flagId);
            if (flaggedImage == null)
                return NotFound(new { message = "Image not found" });

            // Prevent self-reports
            if (flaggedImage.UserId == reportingUserId)
                return BadRequest(new { message = "Cannot report your own content" });

            // Check if already reported by this user
            var existing = await _context.UserReports
                .FirstOrDefaultAsync(r => r.FlaggedImageId == flagId && r.ReportingUserId == reportingUserId);
            if (existing != null)
                return BadRequest(new { message = "Already reported" });

            var report = new CueFinder.Database.Models.UserReport
            {
                ReportingUserId = reportingUserId,
                FlaggedImageId = flagId,
                ReportReason = request?.Reason ?? ""
            };

            _context.UserReports.Add(report);

            // Increase priority if multiple reports
            var queue = await _context.ModerationQueues
                .FirstOrDefaultAsync(q => q.FlaggedImageId == flagId);
            if (queue != null)
            {
                queue.UserReportCount++;
                if (queue.UserReportCount >= 3)
                    queue.Priority = 1; // High priority
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Image reported" });
        }

        public class ApprovalRequest
        {
            public string? Notes { get; set; }
        }

        public class RejectionRequest
        {
            public string? Notes { get; set; }
            public bool BanUser { get; set; }
        }

        public class ReportRequest
        {
            public string? Reason { get; set; }
        }

        /// <summary>
        /// [ADMIN] Stream flagged image content for preview in dashboard
        /// </summary>
        [HttpGet("flagged/{flagId}/image")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetFlaggedImageContent(int flagId)
        {
            var flag = await _context.FlaggedImages.FirstOrDefaultAsync(f => f.Id == flagId);
            if (flag == null)
                return NotFound(new { message = "Flag not found" });

            if (string.IsNullOrWhiteSpace(flag.StoragePath) || !System.IO.File.Exists(flag.StoragePath))
                return NotFound(new { message = "Image file not found" });

            var contentType = GuessContentType(flag.FileName) ?? "application/octet-stream";
            var stream = new FileStream(flag.StoragePath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return File(stream, contentType);
        }

        private static string? GuessContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => null
            };
        }
    }
}
