using Microsoft.AspNetCore.Mvc;
using CueFinder.Extensions.Moderation;
using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace CueFinderModerator.Controllers
{
    /// <summary>
    /// Moderation microservice API endpoints
    /// Handles all content moderation operations independently
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ModerationController : ControllerBase
    {
        private readonly IModerationService _moderationService;
        private readonly CueFinderDbContext _context;
        private readonly ILogger<ModerationController> _logger;

        public ModerationController(
            IModerationService moderationService,
            CueFinderDbContext context,
            ILogger<ModerationController> logger)
        {
            _moderationService = moderationService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Scan an image for inappropriate content
        /// </summary>
        [HttpPost("scan-image")]
        public async Task<ActionResult<ModerationResult>> ScanImage([FromBody] ScanImageRequest request)
        {
            try
            {
                _logger.LogInformation($"Scanning image: {request.ImagePath}");
                var result = await _moderationService.ScanImageAsync(
                    request.ImagePath,
                    request.UserId,
                    request.CueId,
                    request.CueCaseId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Image scan failed");
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "Image scanning failed", error = ex.Message });
            }
        }

        /// <summary>
        /// Check if image is already flagged
        /// </summary>
        [HttpGet("check-hash/{hash}")]
        public async Task<IActionResult> CheckImageHash(string hash)
        {
            try
            {
                var flagged = await _moderationService.CheckImageHashAsync(hash);
                return Ok(new { isFlagged = flagged != null, flaggedImage = flagged });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hash check failed");
                return StatusCode(StatusCodes.Status500InternalServerError, 
                    new { message = "Hash check failed" });
            }
        }

        /// <summary>
        /// Get pending moderation items
        /// </summary>
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<object>>> GetPendingFlags([FromQuery] int limit = 50)
        {
            try
            {
                var pending = await _moderationService.GetPendingFlagsAsync(limit);
                return Ok(pending);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get pending flags");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Failed to retrieve pending items" });
            }
        }

        /// <summary>
        /// Approve a flagged image
        /// </summary>
        [HttpPost("approve/{flagId}")]
        public async Task<IActionResult> ApproveFlag(int flagId, [FromBody] ModeratorActionRequest request)
        {
            try
            {
                var success = await _moderationService.ApproveFlagAsync(
                    flagId,
                    request.AdminUserId,
                    request.Notes ?? "");

                if (!success)
                    return NotFound(new { message = "Flag not found" });

                _logger.LogInformation($"Flag {flagId} approved by admin {request.AdminUserId}");
                return Ok(new { message = "Flag approved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Approval failed");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Approval failed" });
            }
        }

        /// <summary>
        /// Reject a flagged image
        /// </summary>
        [HttpPost("reject/{flagId}")]
        public async Task<IActionResult> RejectFlag(int flagId, [FromBody] ModeratorActionRequest request)
        {
            try
            {
                var success = await _moderationService.RejectFlagAsync(
                    flagId,
                    request.AdminUserId,
                    request.Notes ?? "",
                    request.BanUser ?? false);

                if (!success)
                    return NotFound(new { message = "Flag not found" });

                _logger.LogInformation($"Flag {flagId} rejected by admin {request.AdminUserId}");
                return Ok(new { message = "Flag rejected successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Rejection failed");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Rejection failed" });
            }
        }

        /// <summary>
        /// Get similar images by hash
        /// </summary>
        [HttpGet("similar/{hash}")]
        public async Task<ActionResult<IEnumerable<object>>> GetSimilarImages(string hash, [FromQuery] int tolerance = 5)
        {
            try
            {
                var similar = await _moderationService.CheckSimilarImagesAsync(hash, tolerance);
                return Ok(similar);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Similar image check failed");
                return StatusCode(StatusCodes.Status500InternalServerError,
                    new { message = "Similar image check failed" });
            }
        }
    }

    public class ScanImageRequest
    {
        public string ImagePath { get; set; } = string.Empty;
        public int UserId { get; set; }
        public int? CueId { get; set; }
        public int? CueCaseId { get; set; }
    }

    public class ModeratorActionRequest
    {
        public int AdminUserId { get; set; }
        public string? Notes { get; set; }
        public bool? BanUser { get; set; }
    }
}
