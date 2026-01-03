using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CueFinder.Models
{
    /// <summary>
    /// API controller for image upload and management
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
        /// Upload a single image for a cue
        /// </summary>
        [HttpPost("upload")]
        [ProducesResponseType(typeof(ImageUploadResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UploadImage(
            [FromForm] int cueId,
            [FromForm] IFormFile file,
            [FromForm] string? altText = null,
            [FromForm] int displayOrder = 0,
            [FromForm] bool isPrimary = false)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user" });
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

                var response = await _imageService.UploadImageAsync(request, userId);

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

        /// <summary>
        /// Upload multiple images at once
        /// </summary>
        [HttpPost("upload-multiple")]
        [ProducesResponseType(typeof(List<ImageUploadResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> UploadMultipleImages(
            [FromForm] int cueId,
            [FromForm] List<IFormFile> files)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user" });
                }

                if (files == null || files.Count == 0)
                {
                    return BadRequest(new { message = "No files provided" });
                }

                var responses = await _imageService.UploadMultipleImagesAsync(files, cueId, userId);

                // Check if any uploads failed
                var failedUploads = responses.Where(r => !r.Success).ToList();
                if (failedUploads.Any())
                {
                    return BadRequest(new
                    {
                        message = "Some files failed to upload",
                        successful = responses.Where(r => r.Success).Count(),
                        failed = failedUploads.Count(),
                        errors = failedUploads.Select(r => r.ErrorMessage).ToList()
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

        /// <summary>
        /// Get all images for a cue
        /// </summary>
        [HttpGet("cue/{cueId}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(List<CueImage>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetCueImages(int cueId)
        {
            try
            {
                var images = await _imageService.GetCueImagesAsync(cueId);
                if (images == null || images.Count == 0)
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

        /// <summary>
        /// Get a specific image
        /// </summary>
        [HttpGet("{imageId}")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(CueImage), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
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

        /// <summary>
        /// Set an image as primary/thumbnail
        /// </summary>
        [HttpPut("{imageId}/set-primary")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> SetPrimaryImage(int imageId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user" });
                }

                var success = await _imageService.SetPrimaryImageAsync(imageId, userId);
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

        /// <summary>
        /// Delete an image
        /// </summary>
        [HttpDelete("{imageId}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user" });
                }

                var success = await _imageService.DeleteImageAsync(imageId, userId);
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

        /// <summary>
        /// Delete all images for a cue
        /// </summary>
        [HttpDelete("cue/{cueId}")]
        [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> DeleteCueImages(int cueId)
        {
            try
            {
                var userId = GetUserId();
                if (userId == 0)
                {
                    return StatusCode(StatusCodes.Status401Unauthorized, new { message = "Invalid user" });
                }

                var success = await _imageService.DeleteCueImagesAsync(cueId, userId);
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
        /// Extract user ID from claims
        /// </summary>
        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
            {
                return 0;
            }

            return userId;
        }
    }
}
