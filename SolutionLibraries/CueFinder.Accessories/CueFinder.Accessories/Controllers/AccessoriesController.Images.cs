using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace CueFinder.Accessories.Controllers;

/// <summary>
/// AccessoriesController partial: Image upload and management endpoints
/// </summary>
public partial class AccessoriesController
{
    /// <summary>
    /// Upload one or more images for an accessory (owner only)
    /// POST /api/accessories/{id}/images
    /// </summary>
    [HttpPost("{id}/images")]
    [Authorize]
    [ProducesResponseType(typeof(List<AccessoryImageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<AccessoryImageDto>>> UploadAccessoryImages(int id, [FromForm] List<IFormFile> images)
    {
        try
        {
            if (images == null || images.Count == 0)
                return BadRequest(new { message = "No files provided" });

            var userId = GetUserIdFromClaims();
            if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });

            var result = await _imageService.UploadAccessoryImagesAsync(id, images, userId.Value);
            return StatusCode(201, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized image upload for accessory {AccessoryId}", id);
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for accessory {AccessoryId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error uploading images" });
        }
    }

    /// <summary>
    /// Get all images for an accessory (public)
    /// </summary>
    [HttpGet("{id}/images")] 
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<AccessoryImageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<AccessoryImageDto>>> GetAccessoryImages(int id)
    {
        var images = await _imageService.GetAccessoryImagesAsync(id);
        return Ok(images);
    }

    /// <summary>
    /// Get single image (public)
    /// </summary>
    [HttpGet("images/{imageId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AccessoryImageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AccessoryImageDto>> GetAccessoryImage(int imageId)
    {
        var img = await _imageService.GetAccessoryImageAsync(imageId);
        if (img == null) return NotFound(new { message = "Image not found" });
        return Ok(img);
    }

    /// <summary>
    /// Set primary image (owner only)
    /// </summary>
    [HttpPut("{id}/images/{imageId}/primary")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> SetAccessoryPrimaryImage(int id, int imageId)
    {
        var userId = GetUserIdFromClaims();
        if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });
        var ok = await _imageService.SetPrimaryImageAsync(id, imageId, userId.Value);
        if (!ok) return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Not found or not permitted" });
        return Ok(new { message = "Image set as primary" });
    }

    /// <summary>
    /// Delete a single image (owner only)
    /// </summary>
    [HttpDelete("{id}/images/{imageId}")]
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> DeleteAccessoryImage(int id, int imageId)
    {
        var userId = GetUserIdFromClaims();
        if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });
        var ok = await _imageService.DeleteAccessoryImageAsync(id, imageId, userId.Value);
        if (!ok) return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Not found or not permitted" });
        return Ok(new { message = "Image deleted" });
    }

    /// <summary>
    /// Delete all images (owner or admin)
    /// </summary>
    [HttpDelete("{id}/images")] 
    [Authorize]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult> DeleteAccessoryImages(int id)
    {
        var userId = GetUserIdFromClaims();
        if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });
        var isAdmin = User.IsInRole("admin");
        var ok = await _imageService.DeleteAccessoryImagesAsync(id, userId.Value, isAdmin);
        if (!ok) return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Not found or not permitted" });
        return Ok(new { message = "All images deleted" });
    }

    /// <summary>
    /// Extract user ID from JWT claims, checking multiple possible claim types
    /// for compatibility with .NET 8 JsonWebTokenHandler claim mapping.
    /// </summary>
    private int? GetUserIdFromClaims()
    {
        var userIdStr = User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User?.FindFirst("sub")?.Value
            ?? User?.FindFirst("nameid")?.Value;
        return int.TryParse(userIdStr, out int userId) ? userId : null;
    }
}
