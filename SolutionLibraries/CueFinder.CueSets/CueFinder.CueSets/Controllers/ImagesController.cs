using CueFinder.CueSets.Interfaces;
using CueFinder.CueSets.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.CueSets.Controllers;

[ApiController]
[Route("api/cuesets/{cueSetId}/images")]
public class CueSetImagesController : ControllerBase
{
    private readonly IImageService _imageService;
    private readonly ILogger<CueSetImagesController> _logger;

    public CueSetImagesController(IImageService imageService, ILogger<CueSetImagesController> logger)
    {
        _imageService = imageService;
        _logger = logger;
    }

    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(List<CueSetImageDto>), StatusCodes.Status201Created)]
    public async Task<ActionResult<List<CueSetImageDto>>> UploadImages(int cueSetId, [FromForm] List<IFormFile> files)
    {
        try
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { message = "No files uploaded" });

            var userId = GetCurrentUserId();
            var images = await _imageService.UploadImagesAsync(cueSetId, files, userId);
            return CreatedAtAction(nameof(GetImages), new { cueSetId }, images);
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized upload attempt for cue set {CueSetId}", cueSetId);
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading images for cue set {CueSetId}", cueSetId);
            return StatusCode(500, new { message = "Error uploading images", error = ex.Message });
        }
    }

    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueSetImageDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<CueSetImageDto>>> GetImages(int cueSetId)
    {
        try
        {
            var images = await _imageService.GetCueSetImagesAsync(cueSetId);
            return Ok(images);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving images for cue set {CueSetId}", cueSetId);
            return StatusCode(500, new { message = "Error retrieving images", error = ex.Message });
        }
    }

    [HttpDelete("{imageId}")]
    [Authorize]
    public async Task<ActionResult> DeleteImage(int cueSetId, int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _imageService.DeleteImageAsync(imageId, userId);
            if (!success) return NotFound(new { message = "Image not found" });
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

    [HttpPut("{imageId}/set-primary")]
    [Authorize]
    public async Task<ActionResult> SetPrimaryImage(int cueSetId, int imageId)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _imageService.SetPrimaryImageAsync(imageId, cueSetId, userId);
            if (!success) return NotFound(new { message = "Image not found" });
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

    private int GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value
            ?? User.FindFirst("nameid")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("User ID not found in token");

        return userId;
    }
}
