#if false // disabled: use moderation controller from SolutionLibraries (CueFinder.Extensions) to avoid route duplication
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using CueFinder.Extensions.Moderation;
using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace CueFinderBE.Controllers
{
    /// <summary>
    /// API endpoints for image moderation
    /// </summary>
    [ApiController]
    // Backend moderation controller: keep route unique to avoid clashes with extensions library
    [Route("api/app/[controller]")]
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

            // Get user ID from claims
            var userIdClaim = User.FindFirst("sub")?.Value ?? User.FindFirst("nameid")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Invalid user context" });

            // Validate file type
            var allowedMimes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowedMimes.Contains(file.ContentType))
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
                    // Clean up temp file
                    if (System.IO.File.Exists(tempPath))
                        System.IO.File.Delete(tempPath);

                    return BadRequest(new
                    {
                        message = "Image rejected - violates content policy",
                        flag_reason = scanResult.FlagReason,
                        confidence = scanResult.ConfidenceScore
                    });
                }

                // Image passed - move to public storage or return temp path
                // For now, return the path (you'll need to implement MoveToPublicStorageAsync)
                var publicPath = $"/uploads/approved/{filename}";
                
                // Create approved directory
                var approvedDir = Path.Combine(_hostEnvironment.ContentRootPath, "uploads", "approved");
                Directory.CreateDirectory(approvedDir);

                var publicFullPath = Path.Combine(approvedDir, filename);
                System.IO.File.Move(tempPath, publicFullPath);

                _logger.LogInformation($"Image uploaded successfully: {filename} by user {userId}");

                return Ok(new
                {
                    message = "Image uploaded successfully",
                    filename = filename,
                    url = publicPath,
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
    }
}
#endif
