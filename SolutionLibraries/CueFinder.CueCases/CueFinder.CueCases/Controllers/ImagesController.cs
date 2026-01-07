using CueFinder.CueCases.Interfaces;
using CueFinder.CueCases.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.CueCases.Controllers;

/// <summary>
/// API Controller for cue case image management
/// </summary>
[ApiController]
[Route("api/cuecases/{cueCaseId}/[controller]")]
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
    /// Upload images for a cue case
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(List<CueCaseImageDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<List<CueCaseImageDto>>> UploadImages(int cueCaseId, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "No files uploaded" });

            var userId = GetCurrentUserId();
            var images = await _imageService.UploadImagesAsync(cueCaseId, files, userId);

            return CreatedAtAction(nameof(GetImages), new { cueCaseId }, images);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized upload attempt for cue case {CueCaseId}", cueCaseId);
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid upload request for cue case {CueCaseId}", cueCaseId);
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for cue case {CueCaseId}", cueCaseId);
            return StatusCode(500, new { message = "Error uploading images", error = ex.Message });
        }
    }

    /// <summary>
    /// Get all images for a cue case
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueCaseImageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueCaseImageDto>>> GetImages(int cueCaseId)
    {
        try
        {
            var images = await _imageService.GetCueCaseImagesAsync(cueCaseId);
            return Ok(images);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving images for cue case {CueCaseId}", cueCaseId);
            return StatusCode(500, new { message = "Error retrieving images", error = ex.Message });
        }
    }

    /// <summary>
    /// Delete an image from a cue case
    /// </summary>
    [HttpDelete("{imageId}")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> DeleteImage(int cueCaseId, int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _imageService.DeleteImageAsync(imageId, userId);

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
    /// Set an image as the primary image
    /// </summary>
    [HttpPut("{imageId}/set-primary")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult> SetPrimaryImage(int cueCaseId, int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _imageService.SetPrimaryImageAsync(imageId, cueCaseId, userId);

            if (!success)
                return NotFound(new { message = "Image not found" });

            return Ok(new { message = "Primary image updated" });
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized primary image update for image {ImageId}", imageId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
            return StatusCode(500, new { message = "Error setting primary image", error = ex.Message });
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

    #endregion
}
