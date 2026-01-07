using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.CueCases.Controllers;

/// <summary>
/// API Controller for cue case management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class CueCasesController : ControllerBase
{
    private readonly ICueCaseService _cueCaseService;
    private readonly ILogger<CueCasesController> _logger;

    public CueCasesController(ICueCaseService cueCaseService, ILogger<CueCasesController> logger)
    {
        _cueCaseService = cueCaseService;
        _logger = logger;
    }

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

    /// <summary>
    /// Create a new cue case listing
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CueCaseResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CueCaseResponseDto>> CreateCueCase([FromBody] CreateCueCaseDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var cueCase = await _cueCaseService.CreateCueCaseAsync(dto, userId);

            return CreatedAtAction(nameof(GetCueCaseById), new { id = cueCase.Id }, cueCase);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cue case");
            return StatusCode(500, new { message = "Error creating cue case", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing cue case (owner only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(CueCaseResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueCaseResponseDto>> UpdateCueCase(int id, [FromBody] UpdateCueCaseDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var cueCase = await _cueCaseService.UpdateCueCaseAsync(id, dto, userId);

            if (cueCase == null)
                return NotFound(new { message = "Cue case not found" });

            return Ok(cueCase);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for cue case {CueCaseId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cue case {CueCaseId}", id);
            return StatusCode(500, new { message = "Error updating cue case", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a cue case (owner only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCueCase(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();

            var success = await _cueCaseService.DeleteCueCaseAsync(id, userId, isAdmin);

            if (!success)
                return NotFound(new { message = "Cue case not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for cue case {CueCaseId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cue case {CueCaseId}", id);
            return StatusCode(500, new { message = "Error deleting cue case", error = ex.Message });
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
