using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Models;
using CueFinder.Extensions.Controllers;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Controllers;

/// <summary>
/// API Controller for accessory management operations
/// Split into partial classes for better organization and maintainability
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class AccessoriesController : BaseApiController
{
    private readonly IAccessoryService _accessoryService;
    private readonly ILogger<AccessoriesController> _logger;

    public AccessoriesController(IAccessoryService accessoryService, ILogger<AccessoriesController> logger)
    {
        _accessoryService = accessoryService;
        _logger = logger;
    }

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
