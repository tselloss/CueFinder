using CueFinder.Accessories.Interfaces;
using CueFinder.Accessories.Models;
using CueFinder.Auth.Extensions;
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
    /// Upload a single image for an accessory (owner only)
    /// </summary>
    [HttpPost("{id}/images")] 
    [Authorize]
    [ProducesResponseType(typeof(AccessoryImageDto), StatusCodes.Status201Created)]
    public async Task<ActionResult<AccessoryImageDto>> UploadAccessoryImage(
        int id,
        [FromForm] IFormFile file,
        [FromForm] string? altText = null,
        [FromForm] int displayOrder = 0,
        [FromForm] bool isPrimary = false)
    {
        try
        {
            var userId = User.GetUserId();
            if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });

            if (file == null || file.Length == 0) return BadRequest(new { message = "No file provided" });

            var result = await _imageService.UploadAccessoryImageAsync(id, file, userId.Value, altText, displayOrder, isPrimary);
            return CreatedAtAction(nameof(GetAccessoryImages), new { id }, result);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized image upload for accessory {AccessoryId}", id);
            return StatusCode(StatusCodes.Status401Unauthorized, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for accessory {AccessoryId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error uploading image" });
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
        var userId = User.GetUserId();
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
        var userId = User.GetUserId();
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
        var userId = User.GetUserId();
        if (!userId.HasValue) return Unauthorized(new { message = "Invalid user" });
        var isAdmin = User.IsInRole("admin");
        var ok = await _imageService.DeleteAccessoryImagesAsync(id, userId.Value, isAdmin);
        if (!ok) return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Not found or not permitted" });
        return Ok(new { message = "All images deleted" });
    }
}
