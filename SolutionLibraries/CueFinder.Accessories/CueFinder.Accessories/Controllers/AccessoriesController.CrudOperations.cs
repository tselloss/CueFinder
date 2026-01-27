using CueFinder.Accessories.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CueFinder.Accessories.Controllers;

/// <summary>
/// API Controller for accessory management operations
/// Partial class: Create, Update, Delete operations
/// </summary>
public partial class AccessoriesController
{
    /// <summary>
    /// Create a new accessory listing
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(AccessoryResponseDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<AccessoryResponseDto>> CreateAccessory([FromBody] CreateAccessoryDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var accessory = await _accessoryService.CreateAccessoryAsync(dto, userId);

            return CreatedAtAction(nameof(GetAccessoryById), new { id = accessory.Id }, accessory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating accessory");
            return StatusCode(500, new { message = "Error creating accessory", error = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing accessory (owner only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize]
    [ProducesResponseType(typeof(AccessoryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccessoryResponseDto>> UpdateAccessory(int id, [FromBody] UpdateAccessoryDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();
            var accessory = await _accessoryService.UpdateAccessoryAsync(id, dto, userId);

            if (accessory == null)
                return NotFound(new { message = "Accessory not found" });

            return Ok(accessory);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized update attempt for accessory {AccessoryId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating accessory {AccessoryId}", id);
            return StatusCode(500, new { message = "Error updating accessory", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an accessory (owner only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteAccessory(int id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();

            var success = await _accessoryService.DeleteAccessoryAsync(id, userId, isAdmin);

            if (!success)
                return NotFound(new { message = "Accessory not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for accessory {AccessoryId}", id);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting accessory {AccessoryId}", id);
            return StatusCode(500, new { message = "Error deleting accessory", error = ex.Message });
        }
    }
}
