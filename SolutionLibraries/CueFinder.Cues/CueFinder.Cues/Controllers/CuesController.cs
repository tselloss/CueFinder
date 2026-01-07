using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.Cues.Controllers;

/// <summary>
/// API Controller for cue management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CuesController : ControllerBase
{
    private readonly ICueService _cueService;
    private readonly ILogger<CuesController> _logger;

    public CuesController(ICueService cueService, ILogger<CuesController> logger)
    {
        _cueService = cueService;
        _logger = logger;
    }

    /// <summary>
    /// Get all cues with optional filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueResponseDto>>> GetAllCues(
        [FromQuery] string? condition = null,
        [FromQuery] string? brand = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "newest")
    {
        try
        {
            var cues = await _cueService.GetAllCuesAsync(condition, brand, minPrice, maxPrice, sortBy);
            return Ok(cues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cues");
            return StatusCode(500, new { message = "Error retrieving cues", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific cue by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CueResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueResponseDto>> GetCueById(int id)
    {
        try
        {
            var cue = await _cueService.GetCueByIdAsync(id);
            
            if (cue == null)
                return NotFound(new { message = "Cue not found" });

            return Ok(cue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue {CueId}", id);
            return StatusCode(500, new { message = "Error retrieving cue", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all cues created by a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueResponseDto>>> GetUserCues(int userId)
    {
        try
        {
            var cues = await _cueService.GetUserCuesAsync(userId);
            return Ok(cues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cues for user {UserId}", userId);
            return StatusCode(500, new { message = "Error retrieving user cues", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all cues created by the current authenticated user
    /// </summary>
    [HttpGet("my-cues")]
    [Authorize]
    [ProducesResponseType(typeof(List<CueResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CueResponseDto>>> GetMyCues()
    {
        try
        {
            var userId = GetCurrentUserId();
            var cues = await _cueService.GetUserCuesAsync(userId);
            return Ok(cues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's cues");
            return StatusCode(500, new { message = "Error retrieving your cues", error = ex.Message });
        }
    }

    /// <summary>
    /// Search cues by keyword
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueResponseDto>>> SearchCues([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Search query cannot be empty" });

            var cues = await _cueService.SearchCuesAsync(q);
            return Ok(cues);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching cues with query: {Query}", q);
            return StatusCode(500, new { message = "Error searching cues", error = ex.Message });
        }
    }

    /// <summary>
    /// Create a new cue listing
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CueResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CueResponseDto>> CreateCue([FromBody] CreateCueDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var cue = await _cueService.CreateCueAsync(dto, userId);

            return CreatedAtAction(nameof(GetCueById), new { id = cue.Id }, cue);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cue");
            return StatusCode(500, new { message = "Error creating cue", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing cue (owner only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(CueResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueResponseDto>> UpdateCue(int id, [FromBody] UpdateCueDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var cue = await _cueService.UpdateCueAsync(id, dto, userId);

            if (cue == null)
                return NotFound(new { message = "Cue not found" });

            return Ok(cue);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for cue {CueId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cue {CueId}", id);
            return StatusCode(500, new { message = "Error updating cue", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a cue (owner only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCue(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();

            var success = await _cueService.DeleteCueAsync(id, userId, isAdmin);

            if (!success)
                return NotFound(new { message = "Cue not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for cue {CueId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cue {CueId}", id);
            return StatusCode(500, new { message = "Error deleting cue", error = ex.Message });
        }
    }

    #region Helper Methods

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token");

        return userId;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("admin") || User.HasClaim(ClaimTypes.Role, "admin");
    }

    #endregion
}
