using CueFinder.Database.Models;
using CueFinder.Extensions.Images;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.Extensions.Controllers;

/// <summary>
/// API controller for image upload and management.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
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
    /// System/internal endpoint: deletes all images for a cue (DB + disk folder).
    /// Intended to be called from the backend when a listing is sold/deleted.
    /// </summary>
    [HttpDelete("cue/{cueId}/system")]
    [Authorize(Roles = "admin")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteCueImagesSystem(int cueId)
    {
        await _imageService.DeleteCueImagesInternalAsync(cueId);
        return Ok(new { message = "Cue images deleted" });
    }

    [HttpPost("upload")]
    [ProducesResponseType(typeof(ImageUploadResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadImage(
        [FromForm] int cueId,
        [FromForm] IFormFile file,
        [FromForm] string? altText = null,
        [FromForm] int displayOrder = 0,
        [FromForm] bool isPrimary = false)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file provided" });
            }

            var request = new ImageUploadRequest
            {
                File = file,
                CueId = cueId,
                AltText = altText,
                DisplayOrder = displayOrder,
                IsPrimary = isPrimary
            };

            var response = await _imageService.UploadImageAsync(request, userId.Value);
            if (!response.Success)
            {
                return BadRequest(new { message = response.ErrorMessage });
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image for cue {CueId}", cueId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while uploading the image" });
        }
    }

    [HttpPost("upload-multiple")]
    [ProducesResponseType(typeof(List<ImageUploadResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadMultipleImages(
        [FromForm] int cueId,
        [FromForm] List<IFormFile> files)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "No files provided" });
            }

            var responses = await _imageService.UploadMultipleImagesAsync(files, cueId, userId.Value);

            var failedUploads = responses.Where(r => !r.Success).ToList();
            if (failedUploads.Any())
            {
                return BadRequest(new
                {
                    message = "Some files failed to upload",
                    successful = responses.Count(r => r.Success),
                    failed = failedUploads.Count,
                    errors = failedUploads.Select(r => r.ErrorMessage ?? "Unknown error").ToList()
                });
            }

            return Ok(responses);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading multiple images for cue {CueId}", cueId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while uploading the images" });
        }
    }

    [HttpGet("cue/{cueId}")]
    [HttpGet("cues/{cueId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<CueImage>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCueImages(int cueId)
    {
        try
        {
            var images = await _imageService.GetCueImagesAsync(cueId);
            if (images.Count == 0)
            {
                return NotFound(new { message = "No images found for this cue" });
            }

            return Ok(images);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving images for cue {CueId}", cueId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving images" });
        }
    }

    [HttpGet("{imageId}")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(CueImage), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetImage(int imageId)
    {
        try
        {
            var image = await _imageService.GetImageAsync(imageId);
            if (image == null)
            {
                return NotFound(new { message = "Image not found" });
            }

            return Ok(image);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving image {ImageId}", imageId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while retrieving the image" });
        }
    }

    [HttpPut("{imageId}/set-primary")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> SetPrimaryImage(int imageId)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var success = await _imageService.SetPrimaryImageAsync(imageId, userId.Value);
            if (!success)
            {
                return NotFound(new { message = "Image not found or you don't have permission" });
            }

            return Ok(new { message = "Image set as primary" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ImageId}", imageId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while updating the image" });
        }
    }

    [HttpDelete("{imageId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteImage(int imageId)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var success = await _imageService.DeleteImageAsync(imageId, userId.Value);
            if (!success)
            {
                return NotFound(new { message = "Image not found or you don't have permission" });
            }

            return Ok(new { message = "Image deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image {ImageId}", imageId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while deleting the image" });
        }
    }

    [HttpDelete("cue/{cueId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> DeleteCueImages(int cueId)
    {
        try
        {
            var userId = GetUserIdFromClaims();
            if (!userId.HasValue)
            {
                return Unauthorized(new { message = "Invalid user" });
            }

            var success = await _imageService.DeleteCueImagesAsync(cueId, userId.Value);
            if (!success)
            {
                return StatusCode(StatusCodes.Status401Unauthorized,
                    new { message = "Cue not found or you don't have permission" });
            }

            return Ok(new { message = "All images deleted successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting images for cue {CueId}", cueId);
            return StatusCode(StatusCodes.Status500InternalServerError,
                new { message = "An error occurred while deleting the images" });
        }
    }

    /// <summary>
    /// Helper method to extract user ID from JWT claims.
    /// </summary>
    private int? GetUserIdFromClaims()
    {
        if (User?.FindFirst("sub")?.Value is string userIdStr &&
            int.TryParse(userIdStr, out int userId))
        {
            return userId;
        }
        return null;
    }
}

