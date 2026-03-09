using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Cues.Controllers;

/// <summary>
/// CuesController - CRUD Operations Partial Class
/// Handles Create, Read, Update, Delete operations for cues
/// </summary>
public partial class CuesController
{
    /// <summary>
    /// Get a specific cue by ID
    /// </summary>
    [HttpGet("{id}")]
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
}
