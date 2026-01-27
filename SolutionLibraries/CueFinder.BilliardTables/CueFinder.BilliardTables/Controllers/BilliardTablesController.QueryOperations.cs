using CueFinder.BilliardTables.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Controllers;

/// <summary>
/// API Controller for billiard table management operations
/// Partial class: Query and read operations
/// </summary>
public partial class BilliardTablesController
{
    /// <summary>
    /// Get all billiard tables with optional filtering
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BilliardTableResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BilliardTableResponseDto>>> GetAllBilliardTables(
        [FromQuery] string? condition = null,
        [FromQuery] string? brand = null,
        [FromQuery] decimal? minPrice = null,
        [FromQuery] decimal? maxPrice = null,
        [FromQuery] string sortBy = "newest")
    {
        try
        {
            var tables = await _tableService.GetAllBilliardTablesAsync(condition, brand, minPrice, maxPrice, sortBy);
            return Ok(tables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving billiard tables");
            return StatusCode(500, new { message = "Error retrieving billiard tables", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific billiard table by ID
    /// </summary>
    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(BilliardTableResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BilliardTableResponseDto>> GetBilliardTableById(int id)
    {
        try
        {
            var table = await _tableService.GetBilliardTableByIdAsync(id);
            
            if (table == null)
                return NotFound(new { message = "Billiard table not found" });

            return Ok(table);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving billiard table {TableId}", id);
            return StatusCode(500, new { message = "Error retrieving billiard table", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all billiard tables created by a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BilliardTableResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BilliardTableResponseDto>>> GetUserBilliardTables(int userId)
    {
        try
        {
            var tables = await _tableService.GetUserBilliardTablesAsync(userId);
            return Ok(tables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving billiard tables for user {UserId}", userId);
            return StatusCode(500, new { message = "Error retrieving user billiard tables", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all billiard tables created by the current authenticated user
    /// </summary>
    [HttpGet("my-tables")]
    [Authorize]
    [ProducesResponseType(typeof(List<BilliardTableResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<BilliardTableResponseDto>>> GetMyTables()
    {
        try
        {
            var userId = GetCurrentUserId();
            var tables = await _tableService.GetUserBilliardTablesAsync(userId);
            return Ok(tables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving current user's billiard tables");
            return StatusCode(500, new { message = "Error retrieving your billiard tables", error = ex.Message });
        }
    }

    /// <summary>
    /// Search billiard tables by keyword
    /// </summary>
    [HttpGet("search")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<BilliardTableResponseDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BilliardTableResponseDto>>> SearchBilliardTables([FromQuery] string q)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(q))
                return BadRequest(new { message = "Search query cannot be empty" });

            var tables = await _tableService.SearchBilliardTablesAsync(q);
            return Ok(tables);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching billiard tables with query: {Query}", q);
            return StatusCode(500, new { message = "Error searching billiard tables", error = ex.Message });
        }
    }
}
