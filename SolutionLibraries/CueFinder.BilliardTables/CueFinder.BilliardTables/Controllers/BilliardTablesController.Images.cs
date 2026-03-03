using CueFinder.BilliardTables.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.BilliardTables.Controllers;

/// <summary>
/// BilliardTablesController partial: Image upload and management endpoints
/// </summary>
public partial class BilliardTablesController
{
    /// <summary>
    /// Upload images for a billiard table (owner only)
    /// POST /api/billiardtables/{id}/images
    /// </summary>
    [HttpPost("{id}/images")]
    [Authorize]
    [ProducesResponseType(typeof(List<BilliardTableImageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<BilliardTableImageDto>>> UploadTableImages(int id, [FromForm] List<IFormFile> images)
    {
        try
        {
            if (images == null || images.Count == 0)
                return BadRequest(new { message = "No files provided" });

            var userId = GetCurrentUserId();
            var result = await _imageService.UploadBilliardTableImagesAsync(id, images, userId);
            return StatusCode(201, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized image upload for billiard table {TableId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for billiard table {TableId}", id);
            return StatusCode(500, new { message = "Error uploading images" });
        }
    }

    /// <summary>
    /// Delete a single image by imageId (owner only)
    /// DELETE /api/billiardtables/images/{imageId}
    /// </summary>
    [HttpDelete("images/{imageId}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteTableImage(int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            // tableId=0: ownership is checked via image→table lookup in the service
            var ok = await _imageService.DeleteBilliardTableImageAsync(0, imageId, userId);
            if (!ok)
                return NotFound(new { message = "Image not found or not permitted" });
            return Ok(new { message = "Image deleted" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting billiard table image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error deleting image" });
        }
    }

    /// <summary>
    /// Set primary image for a billiard table (owner only)
    /// PUT /api/billiardtables/{id}/set-primary-image
    /// </summary>
    [HttpPut("{id}/set-primary-image")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SetPrimaryImage(int id, [FromBody] SetPrimaryImageRequest request)
    {
        try
        {
            var userId = GetCurrentUserId();
            var ok = await _imageService.SetPrimaryImageAsync(id, request.ImageId, userId);
            if (!ok)
                return NotFound(new { message = "Image not found or not permitted" });
            return Ok(new { message = "Primary image updated" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image for billiard table {TableId}", id);
            return StatusCode(500, new { message = "Error setting primary image" });
        }
    }
}

/// <summary>
/// Request body for set-primary-image endpoint
/// </summary>
public class SetPrimaryImageRequest
{
    public int ImageId { get; set; }
}
