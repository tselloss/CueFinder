using CueFinder.Cues.Interfaces;
using CueFinder.Cues.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.Cues.Controllers;

/// <summary>
/// API Controller for cue image management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IImageService _imageService;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(IImageService imageService, ILogger<ImagesController> logger)
    {
        _imageService = imageService;
        _logger = logger;
    }

    /// <summary>
    /// Upload one or more images for a cue (owner only)
    /// </summary>
    [HttpPost("cues/{cueId}")]
    [Authorize]
    [ProducesResponseType(typeof(List<CueImageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<List<CueImageDto>>> UploadImages(
        int cueId,
        [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || !files.Any())
                return BadRequest(new { message = "No files provided" });

            var userId = GetCurrentUserId();

            var uploadedImages = new List<CueImageDto>();

            foreach (var file in files)
            {
                if (file.Length == 0)
                    continue;

                var image = await _imageService.UploadImageAsync(
                    cueId, 
                    file, 
                    userId,
                    altText: null,
                    displayOrder: uploadedImages.Count,
                    isPrimary: false
                );
                uploadedImages.Add(image);
            }

            if (!uploadedImages.Any())
                return BadRequest(new { message = "No valid images were uploaded" });

            return CreatedAtAction(nameof(GetCueImages), new { cueId }, uploadedImages);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized image upload attempt for cue {CueId}", cueId);
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid image upload for cue {CueId}", cueId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for cue {CueId}", cueId);
            return StatusCode(500, new { message = "Error uploading images", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all images for a specific cue
    /// </summary>
    [HttpGet("cues/{cueId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueImageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueImageDto>>> GetCueImages(int cueId)
    {
        try
        {
            var images = await _imageService.GetCueImagesAsync(cueId);
            return Ok(images);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving images for cue {CueId}", cueId);
            return StatusCode(500, new { message = "Error retrieving images", error = ex.Message });
        }
    }

    /// <summary>
    /// Get a specific image by ID
    /// </summary>
    [HttpGet("{imageId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CueImageDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CueImageDto>> GetImageById(int imageId)
    {
        try
        {
            var image = await _imageService.GetImageByIdAsync(imageId);

            if (image == null)
                return NotFound(new { message = "Image not found" });

            return Ok(image);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error retrieving image", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete a specific image (owner only)
    /// </summary>
    [HttpDelete("{imageId}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteImage(int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var isAdmin = IsAdmin();

            var success = await _imageService.DeleteImageAsync(imageId, userId, isAdmin);

            if (!success)
                return NotFound(new { message = "Image not found" });

            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized delete attempt for image {ImageId}", imageId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error deleting image", error = ex.Message });
        }
    }

    /// <summary>
    /// Set an image as the primary image for its cue (owner only)
    /// </summary>
    [HttpPut("{imageId}/primary")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SetPrimaryImage(int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();

            var success = await _imageService.SetPrimaryImageAsync(imageId, userId);

            if (!success)
                return NotFound(new { message = "Image not found" });

            return Ok(new { message = "Image set as primary successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized primary image set attempt for image {ImageId}", imageId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error setting primary image", error = ex.Message });
        }
    }

    /// <summary>
    /// Update display order of an image (owner only)
    /// </summary>
    [HttpPut("{imageId}/order")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> UpdateImageOrder(
        int imageId,
        [FromBody] int newOrder)
    {
        try
        {
            if (newOrder < 0)
                return BadRequest(new { message = "Display order cannot be negative" });

            var userId = GetCurrentUserId();

            var success = await _imageService.UpdateImageOrderAsync(imageId, newOrder, userId);

            if (!success)
                return NotFound(new { message = "Image not found" });

            return Ok(new { message = "Image order updated successfully" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized order update attempt for image {ImageId}", imageId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order for image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error updating image order", error = ex.Message });
        }
    }

    #region Helper Methods

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token");

        return userId;
    }

    private bool IsAdmin()
    {
        return User.IsInRole("admin") || User.HasClaim(ClaimTypes.Role, "admin");
    }

    #endregion
}
