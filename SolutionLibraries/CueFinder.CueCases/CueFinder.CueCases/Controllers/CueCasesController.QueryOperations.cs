using CueFinder.CueCases.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueCases.Controllers;

/// <summary>
/// API Controller for cue case management operations
/// Partial class: Query and read operations
/// </summary>
public partial class CueCasesController
{
    /// <summary>
    /// Get all cue cases with optional filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueCaseResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueCaseResponseDto>>> GetAllCueCases(
        [FromQuery] string? condition = null,
        [FromQuery] string? brand = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "newest")
    {
        try
        {
            var cases = await _cueCaseService.GetAllCueCasesAsync(condition, brand, minPrice, maxPrice, sortBy);
            return Ok(cases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue cases");
            return StatusCode(500, new { message = "Error retrieving cue cases", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific cue case by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CueCaseResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueCaseResponseDto>> GetCueCaseById(int id)
    {
        try
        {
            var cueCase = await _cueCaseService.GetCueCaseByIdAsync(id);
            
            if (cueCase == null)
                return NotFound(new { message = "Cue case not found" });

            return Ok(cueCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue case {CueCaseId}", id);
            return StatusCode(500, new { message = "Error retrieving cue case", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all cue cases created by a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueCaseResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueCaseResponseDto>>> GetUserCueCases(int userId)
    {
        try
        {
            var cases = await _cueCaseService.GetUserCueCasesAsync(userId);
            return Ok(cases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving cue cases for user {UserId}", userId);
            return StatusCode(500, new { message = "Error retrieving user cue cases", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all cue cases created by the current authenticated user
    /// </summary>
    [HttpGet("my-cases")]
    [Authorize]
    [ProducesResponseType(typeof(List<CueCaseResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CueCaseResponseDto>>> GetMyCases()
    {
        try
        {
            var userId = GetCurrentUserId();
            var cases = await _cueCaseService.GetUserCueCasesAsync(userId);
            return Ok(cases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's cue cases");
            return StatusCode(500, new { message = "Error retrieving your cue cases", error = ex.Message });
        }
    }

    /// <summary>
    /// Search cue cases by keyword
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueCaseResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueCaseResponseDto>>> SearchCueCases([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Search query cannot be empty" });

            var cases = await _cueCaseService.SearchCueCasesAsync(q);
            return Ok(cases);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching cue cases with query: {Query}", q);
            return StatusCode(500, new { message = "Error searching cue cases", error = ex.Message });
        }
    }
}
