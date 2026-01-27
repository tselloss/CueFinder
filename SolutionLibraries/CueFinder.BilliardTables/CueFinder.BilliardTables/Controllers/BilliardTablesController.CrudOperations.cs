using CueFinder.BilliardTables.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CueFinder.BilliardTables.Controllers;

/// <summary>
/// API Controller for billiard table management operations
/// Partial class: Create, Update, Delete operations
/// </summary>
public partial class BilliardTablesController
{
    /// <summary>
    /// Create a new billiard table listing
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(BilliardTableResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<BilliardTableResponseDto>> CreateBilliardTable([FromBody] CreateBilliardTableDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var table = await _tableService.CreateBilliardTableAsync(dto, userId);

            return CreatedAtAction(nameof(GetBilliardTableById), new { id = table.Id }, table);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating billiard table");
            return StatusCode(500, new { message = "Error creating billiard table", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing billiard table (owner only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(BilliardTableResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BilliardTableResponseDto>> UpdateBilliardTable(int id, [FromBody] UpdateBilliardTableDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var table = await _tableService.UpdateBilliardTableAsync(id, dto, userId);

            if (table == null)
                return NotFound(new { message = "Billiard table not found" });

            return Ok(table);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for billiard table {TableId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating billiard table {TableId}", id);
            return StatusCode(500, new { message = "Error updating billiard table", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a billiard table (owner only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteBilliardTable(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();

            var success = await _tableService.DeleteBilliardTableAsync(id, userId, isAdmin);

            if (!success)
                return NotFound(new { message = "Billiard table not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for billiard table {TableId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting billiard table {TableId}", id);
            return StatusCode(500, new { message = "Error deleting billiard table", error = ex.Message });
        }
    }
}
