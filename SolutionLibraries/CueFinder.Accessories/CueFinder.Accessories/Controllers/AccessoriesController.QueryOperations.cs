using CueFinder.Accessories.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Controllers;

/// <summary>
/// API Controller for accessory management operations
/// Partial class: Query and read operations
/// </summary>
public partial class AccessoriesController
{
    /// <summary>
    /// Get all accessories with optional filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<AccessoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AccessoryResponseDto>>> GetAllAccessories(
        [FromQuery] string? condition = null,
        [FromQuery] string? brand = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "newest")
    {
        try
        {
            var accessories = await _accessoryService.GetAllAccessoriesAsync(condition, brand, minPrice, maxPrice, sortBy);
            return Ok(accessories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving accessories");
            return StatusCode(500, new { message = "Error retrieving accessories", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific accessory by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AccessoryResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccessoryResponseDto>> GetAccessoryById(int id)
    {
        try
        {
            var accessory = await _accessoryService.GetAccessoryByIdAsync(id);
            
            if (accessory == null)
                return NotFound(new { message = "Accessory not found" });

            return Ok(accessory);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving accessory {AccessoryId}", id);
            return StatusCode(500, new { message = "Error retrieving accessory", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all accessories created by a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<AccessoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AccessoryResponseDto>>> GetUserAccessories(int userId)
    {
        try
        {
            var accessories = await _accessoryService.GetUserAccessoriesAsync(userId);
            return Ok(accessories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving accessories for user {UserId}", userId);
            return StatusCode(500, new { message = "Error retrieving user accessories", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all accessories created by the current authenticated user
    /// </summary>
    [HttpGet("my-accessories")]
    [Authorize]
    [ProducesResponseType(typeof(List<AccessoryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<AccessoryResponseDto>>> GetMyAccessories()
    {
        try
        {
            var userId = GetCurrentUserId();
            var accessories = await _accessoryService.GetUserAccessoriesAsync(userId);
            return Ok(accessories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's accessories");
            return StatusCode(500, new { message = "Error retrieving your accessories", error = ex.Message });
        }
    }

    /// <summary>
    /// Search accessories by keyword
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<AccessoryResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AccessoryResponseDto>>> SearchAccessories([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Search query cannot be empty" });

            var accessories = await _accessoryService.SearchAccessoriesAsync(q);
            return Ok(accessories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching accessories with query: {Query}", q);
            return StatusCode(500, new { message = "Error searching accessories", error = ex.Message });
        }
    }
}
