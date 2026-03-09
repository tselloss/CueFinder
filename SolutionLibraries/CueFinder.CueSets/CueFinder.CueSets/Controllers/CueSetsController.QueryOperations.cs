using CueFinder.CueSets.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Controllers;

public partial class CueSetsController
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueSetResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueSetResponseDto>>> GetAllCueSets(
        [FromQuery] string? condition = null,
        [FromQuery] string? brand = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "newest")
    {
        try
        {
            var sets = await _cueSetService.GetAllCueSetsAsync(condition, brand, minPrice, maxPrice, sortBy);
            return Ok(sets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue sets");
            return StatusCode(500, new { message = "Error retrieving cue sets", error = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CueSetResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueSetResponseDto>> GetCueSetById(int id)
    {
        try
        {
            var set = await _cueSetService.GetCueSetByIdAsync(id);
            if (set == null) return NotFound(new { message = "Cue set not found" });
            return Ok(set);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue set {CueSetId}", id);
            return StatusCode(500, new { message = "Error retrieving cue set", error = ex.Message });
        }
    }

    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueSetResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueSetResponseDto>>> GetUserCueSets(int userId)
    {
        try
        {
            var sets = await _cueSetService.GetUserCueSetsAsync(userId);
            return Ok(sets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue sets for user {UserId}", userId);
            return StatusCode(500, new { message = "Error retrieving user cue sets", error = ex.Message });
        }
    }

    [HttpGet("my-sets")]
    [Authorize]
    [ProducesResponseType(typeof(List<CueSetResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CueSetResponseDto>>> GetMySets([FromQuery] bool? hidden = null)
    {
        try
        {
            var userId = GetCurrentUserId();
            var sets = await _cueSetService.GetUserCueSetsAsync(userId, hidden);
            return Ok(sets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's cue sets");
            return StatusCode(500, new { message = "Error retrieving your cue sets", error = ex.Message });
        }
    }

    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueSetResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueSetResponseDto>>> SearchCueSets([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Search query cannot be empty" });

            var sets = await _cueSetService.SearchCueSetsAsync(q);
            return Ok(sets);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching cue sets with query: {Query}", q);
            return StatusCode(500, new { message = "Error searching cue sets", error = ex.Message });
        }
    }
}
