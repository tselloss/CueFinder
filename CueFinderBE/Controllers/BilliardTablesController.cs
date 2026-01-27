using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CueFinder.Database.Models;
using CueFinder.Database.Services;
using System.Security.Claims;

namespace CueFinderBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BilliardTablesController : ControllerBase
    {
        private readonly IBilliardTableService _billiardTableService;
        private readonly ILogger<BilliardTablesController> _logger;

        public BilliardTablesController(
            IBilliardTableService billiardTableService,
            ILogger<BilliardTablesController> logger)
        {
            _billiardTableService = billiardTableService;
            _logger = logger;
        }

        /// <summary>
        /// Get all active billiard tables with pagination
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<object>>> GetAllTables(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (page < 1 || pageSize < 1)
                    return BadRequest("Page and pageSize must be greater than 0");

                var tables = await _billiardTableService.GetActiveTablesWithPaginationAsync(page, pageSize);
                var response = tables.Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    brand = t.Brand,
                    description = t.Description,
                    price = t.Price,
                    tableSize = t.TableSize,
                    tableType = t.TableType,
                    playingSurface = t.PlayingSurface,
                    feltType = t.FeltType,
                    frameMaterial = t.FrameMaterial,
                    condition = t.Condition,
                    location = t.Location,
                    isSold = t.IsSold,
                    userId = t.UserId,
                    createdAt = t.CreatedAt,
                    updatedAt = t.UpdatedAt,
                    images = t.Images?.Select(i => new
                    {
                        id = i.Id,
                        imageUrl = i.ImageUrl,
                        isPrimary = i.IsPrimary,
                        displayOrder = i.DisplayOrder
                    }).OrderBy(i => i.displayOrder).ToList(),
                    user = t.User != null ? new
                    {
                        id = t.User.Id,
                        username = t.User.Username
                    } : null
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all billiard tables");
                return StatusCode(500, "Error retrieving billiard tables");
            }
        }

        /// <summary>
        /// Get a specific billiard table by ID
        /// </summary>
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<ActionResult<object>> GetTableById(int id)
        {
            try
            {
                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                var response = new
                {
                    id = table.Id,
                    title = table.Title,
                    brand = table.Brand,
                    description = table.Description,
                    price = table.Price,
                    tableSize = table.TableSize,
                    tableType = table.TableType,
                    playingSurface = table.PlayingSurface,
                    feltType = table.FeltType,
                    frameMaterial = table.FrameMaterial,
                    pocketType = table.PocketType,
                    features = table.Features,
                    manufactureYear = table.ManufactureYear,
                    condition = table.Condition,
                    location = table.Location,
                    isSold = table.IsSold,
                    viewCount = table.ViewCount,
                    averageRating = table.AverageRating,
                    ratingCount = table.RatingCount,
                    userId = table.UserId,
                    createdAt = table.CreatedAt,
                    updatedAt = table.UpdatedAt,
                    images = table.Images?.Select(i => new
                    {
                        id = i.Id,
                        imageUrl = i.ImageUrl,
                        isPrimary = i.IsPrimary,
                        displayOrder = i.DisplayOrder
                    }).OrderBy(i => i.displayOrder).ToList(),
                    user = table.User != null ? new
                    {
                        id = table.User.Id,
                        username = table.User.Username,
                        email = table.User.Email
                    } : null
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving billiard table {Id}", id);
                return StatusCode(500, "Error retrieving billiard table");
            }
        }

        /// <summary>
        /// Get billiard tables for the current user
        /// </summary>
        [HttpGet("user/my-tables")]
        [Authorize]
        public async Task<ActionResult<IEnumerable<object>>> GetMyTables()
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var tables = await _billiardTableService.GetUserTablesAsync(userId);
                var response = tables.Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    brand = t.Brand,
                    price = t.Price,
                    isSold = t.IsSold,
                    createdAt = t.CreatedAt,
                    images = t.Images?.Select(i => new
                    {
                        id = i.Id,
                        imageUrl = i.ImageUrl,
                        isPrimary = i.IsPrimary
                    }).ToList()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user billiard tables");
                return StatusCode(500, "Error retrieving your tables");
            }
        }

        /// <summary>
        /// Search billiard tables
        /// </summary>
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<object>>> SearchTables(
            [FromQuery] string? query,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                    return BadRequest("Search query is required");

                var tables = await _billiardTableService.SearchTablesAsync(query, page, pageSize);
                var response = tables.Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    brand = t.Brand,
                    price = t.Price,
                    tableSize = t.TableSize,
                    tableType = t.TableType,
                    condition = t.Condition,
                    images = t.Images?.Where(i => i.IsPrimary).Select(i => new { imageUrl = i.ImageUrl }).FirstOrDefault()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching billiard tables");
                return StatusCode(500, "Error searching billiard tables");
            }
        }

        /// <summary>
        /// Get billiard tables with filters
        /// </summary>
        [HttpGet("filter")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<object>>> GetFilteredTables(
            [FromQuery] string? tableSize,
            [FromQuery] string? tableType,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? condition,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            try
            {
                var tables = await _billiardTableService.GetTablesWithFiltersAsync(
                    tableSize, tableType, minPrice, maxPrice, condition, page, pageSize);

                var response = tables.Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    brand = t.Brand,
                    price = t.Price,
                    tableSize = t.TableSize,
                    tableType = t.TableType,
                    condition = t.Condition,
                    location = t.Location,
                    images = t.Images?.Select(i => new
                    {
                        id = i.Id,
                        imageUrl = i.ImageUrl,
                        isPrimary = i.IsPrimary
                    }).ToList()
                });

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving filtered billiard tables");
                return StatusCode(500, "Error retrieving filtered tables");
            }
        }

        /// <summary>
        /// Create a new billiard table listing
        /// </summary>
        [HttpPost]
        [Authorize]
        public async Task<ActionResult<object>> CreateTable([FromBody] CreateBilliardTableRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = new BilliardTable
                {
                    Title = request.Title ?? string.Empty,
                    Brand = request.Brand ?? string.Empty,
                    Description = request.Description ?? string.Empty,
                    Price = request.Price,
                    TableSize = request.TableSize ?? "8-foot",
                    TableType = request.TableType ?? "pool",
                    PlayingSurface = request.PlayingSurface ?? string.Empty,
                    FeltType = request.FeltType ?? string.Empty,
                    FrameMaterial = request.FrameMaterial ?? string.Empty,
                    PocketType = request.PocketType,
                    Features = request.Features,
                    ManufactureYear = request.ManufactureYear,
                    Condition = request.Condition ?? "good",
                    Location = request.Location ?? string.Empty,
                    UserId = userId
                };

                var createdTable = await _billiardTableService.CreateTableAsync(table);

                return CreatedAtAction(nameof(GetTableById), new { id = createdTable.Id }, new
                {
                    id = createdTable.Id,
                    title = createdTable.Title,
                    brand = createdTable.Brand,
                    price = createdTable.Price,
                    createdAt = createdTable.CreatedAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating billiard table");
                return StatusCode(500, "Error creating billiard table");
            }
        }

        /// <summary>
        /// Update an existing billiard table
        /// </summary>
        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateTable(int id, [FromBody] UpdateBilliardTableRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                // Verify ownership
                if (table.UserId != userId)
                    return Forbid("You can only edit your own billiard tables");

                // Update properties
                if (!string.IsNullOrEmpty(request.Title))
                    table.Title = request.Title;
                if (!string.IsNullOrEmpty(request.Brand))
                    table.Brand = request.Brand;
                if (!string.IsNullOrEmpty(request.Description))
                    table.Description = request.Description;
                if (request.Price.HasValue)
                    table.Price = request.Price.Value;
                if (!string.IsNullOrEmpty(request.TableSize))
                    table.TableSize = request.TableSize;
                if (!string.IsNullOrEmpty(request.TableType))
                    table.TableType = request.TableType;
                if (!string.IsNullOrEmpty(request.PlayingSurface))
                    table.PlayingSurface = request.PlayingSurface;
                if (!string.IsNullOrEmpty(request.FeltType))
                    table.FeltType = request.FeltType;
                if (!string.IsNullOrEmpty(request.FrameMaterial))
                    table.FrameMaterial = request.FrameMaterial;
                if (!string.IsNullOrEmpty(request.Condition))
                    table.Condition = request.Condition;
                if (!string.IsNullOrEmpty(request.Location))
                    table.Location = request.Location;

                await _billiardTableService.UpdateTableAsync(table);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating billiard table {Id}", id);
                return StatusCode(500, "Error updating billiard table");
            }
        }

        /// <summary>
        /// Delete a billiard table listing
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteTable(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                // Verify ownership
                if (table.UserId != userId)
                    return Forbid("You can only delete your own billiard tables");

                await _billiardTableService.DeleteTableAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting billiard table {Id}", id);
                return StatusCode(500, "Error deleting billiard table");
            }
        }

        /// <summary>
        /// Mark a billiard table as sold
        /// </summary>
        [HttpPut("{id}/mark-sold")]
        [Authorize]
        public async Task<IActionResult> MarkAsSold(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                // Verify ownership
                if (table.UserId != userId)
                    return Forbid("You can only mark your own tables as sold");

                await _billiardTableService.MarkAsSoldAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking table as sold {Id}", id);
                return StatusCode(500, "Error marking table as sold");
            }
        }

        /// <summary>
        /// Get count of active billiard tables
        /// </summary>
        [HttpGet("count/active")]
        [AllowAnonymous]
        public async Task<ActionResult<int>> GetActiveTablesCount()
        {
            try
            {
                var count = await _billiardTableService.GetActiveTablesCountAsync();
                return Ok(count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting active tables count");
                return StatusCode(500, "Error getting count");
            }
        }

        /// <summary>
        /// Upload images for a billiard table
        /// </summary>
        [HttpPost("{id}/images")]
        [Authorize]
        public async Task<IActionResult> UploadImages(int id)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                // Verify ownership
                if (table.UserId != userId)
                    return Forbid("You can only upload images to your own tables");

                var files = Request.Form.Files;
                if (files.Count == 0)
                    return BadRequest("No images provided");

                var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
                if (!Directory.Exists(uploadsDir))
                    Directory.CreateDirectory(uploadsDir);

                foreach (var file in files)
                {
                    if (file.Length == 0)
                        continue;

                    var fileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
                    var filePath = Path.Combine(uploadsDir, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    var hasImages = table.Images?.Any() ?? false;
                    var image = new BilliardTableImage
                    {
                        BilliardTableId = id,
                        ImageUrl = $"/uploads/{fileName}",
                        IsPrimary = !hasImages, // First image is primary
                        DisplayOrder = (table.Images?.Count ?? 0) + 1
                    };

                    await _billiardTableService.AddImageAsync(id, image);
                }

                return Ok("Images uploaded successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading images for table {Id}", id);
                return StatusCode(500, "Error uploading images");
            }
        }

        /// <summary>
        /// Remove an image from a billiard table
        /// </summary>
        [HttpDelete("images/{imageId}")]
        [Authorize]
        public async Task<IActionResult> RemoveImage(int imageId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                // Note: Service should verify ownership through the image->table relationship
                await _billiardTableService.RemoveImageAsync(imageId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing image {ImageId}", imageId);
                return StatusCode(500, "Error removing image");
            }
        }

        /// <summary>
        /// Set primary image for a billiard table
        /// </summary>
        [HttpPut("{id}/set-primary-image")]
        [Authorize]
        public async Task<IActionResult> SetPrimaryImage(int id, [FromBody] SetPrimaryImageRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                    return Unauthorized("Invalid user ID");

                var table = await _billiardTableService.GetTableWithDetailsAsync(id);
                if (table == null)
                    return NotFound("Billiard table not found");

                // Verify ownership
                if (table.UserId != userId)
                    return Forbid("You can only update your own tables");

                await _billiardTableService.SetPrimaryImageAsync(id, request.ImageId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error setting primary image for table {Id}", id);
                return StatusCode(500, "Error setting primary image");
            }
        }
    }

    /// <summary>
    /// Request model for setting primary image
    /// </summary>
    public class SetPrimaryImageRequest
    {
        public int ImageId { get; set; }
    }

    /// <summary>
    /// Request model for creating a billiard table
    /// </summary>
    public class CreateBilliardTableRequest
    {
        public string? Title { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? TableSize { get; set; }
        public string? TableType { get; set; }
        public string? PlayingSurface { get; set; }
        public string? FeltType { get; set; }
        public string? FrameMaterial { get; set; }
        public string? PocketType { get; set; }
        public string? Features { get; set; }
        public int? ManufactureYear { get; set; }
        public string? Condition { get; set; }
        public string? Location { get; set; }
    }

    /// <summary>
    /// Request model for updating a billiard table
    /// </summary>
    public class UpdateBilliardTableRequest
    {
        public string? Title { get; set; }
        public string? Brand { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public string? TableSize { get; set; }
        public string? TableType { get; set; }
        public string? PlayingSurface { get; set; }
        public string? FeltType { get; set; }
        public string? FrameMaterial { get; set; }
        public string? Condition { get; set; }
        public string? Location { get; set; }
    }
}
