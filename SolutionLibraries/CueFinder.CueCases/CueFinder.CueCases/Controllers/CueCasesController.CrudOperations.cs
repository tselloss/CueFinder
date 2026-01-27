using CueFinder.CueCases.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CueFinder.CueCases.Controllers;

/// <summary>
/// API Controller for cue case management operations
/// Partial class: Create, Update, Delete operations
/// </summary>
public partial class CueCasesController
{
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
}
