using CueFinder.CueSets.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.CueSets.Controllers;

public partial class CueSetsController
{
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(CueSetResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<CueSetResponseDto>> CreateCueSet([FromBody] CreateCueSetDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var userId = GetCurrentUserId();
            var set = await _cueSetService.CreateCueSetAsync(dto, userId);
            return CreatedAtAction(nameof(GetCueSetById), new { id = set.Id }, set);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating cue set");
            return StatusCode(500, new { message = "Error creating cue set", error = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(CueSetResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueSetResponseDto>> UpdateCueSet(int id, [FromBody] UpdateCueSetDto dto)
    {
        try
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var userId = GetCurrentUserId();
            var set = await _cueSetService.UpdateCueSetAsync(id, dto, userId);
            if (set == null) return NotFound(new { message = "Cue set not found" });
            return Ok(set);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for cue set {CueSetId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating cue set {CueSetId}", id);
            return StatusCode(500, new { message = "Error updating cue set", error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteCueSet(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();
            var success = await _cueSetService.DeleteCueSetAsync(id, userId, isAdmin);
            if (!success) return NotFound(new { message = "Cue set not found" });
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for cue set {CueSetId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting cue set {CueSetId}", id);
            return StatusCode(500, new { message = "Error deleting cue set", error = ex.Message });
        }
    }
}
