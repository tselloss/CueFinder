using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Controllers;

/// <summary>
/// CuesController - Query and Read Operations Partial Class
/// Handles retrieval and search operations for cues
/// </summary>
public partial class CuesController
{
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
    public async Task<ActionResult<List<CueResponseDto>>> GetMyCues([FromQuery] bool? hidden = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var cues = await _cueService.GetUserCuesAsync(userId, hidden);
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
}
