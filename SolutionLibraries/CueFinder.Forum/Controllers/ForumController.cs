using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;
using CueFinder.Database.Context;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CueFinder.Forum.Controllers;

[ApiController]
[Route("api/forum")]
public class ForumController : ControllerBase
{
    private readonly ForumDbContext _context;
    private readonly CueFinderDbContext _dbContext;
    private readonly ILogger<ForumController> _logger;

    public ForumController(ForumDbContext context, CueFinderDbContext dbContext, ILogger<ForumController> logger)
    {
        _context = context;
        _dbContext = dbContext;
        _logger = logger;
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<CategoryResponseDto>>> GetCategories()
    {
        try
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new CategoryResponseDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    DisplayOrder = c.DisplayOrder,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    ModifiedAt = c.ModifiedAt,
                    DiscussionCount = c.Discussions.Count()
                })
                .ToListAsync();
            return Ok(categories);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting categories");
            return StatusCode(500, "Error retrieving categories");
        }
    }

    private Guid GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrWhiteSpace(userIdClaim) && Guid.TryParse(userIdClaim, out var guidId))
        {
            return guidId;
        }

        // Some tokens use int-based user IDs; convert deterministically to a GUID to preserve uniqueness
        if (!string.IsNullOrWhiteSpace(userIdClaim) && int.TryParse(userIdClaim, out _))
        {
            using var md5 = MD5.Create();
            var hash = md5.ComputeHash(System.Text.Encoding.UTF8.GetBytes(userIdClaim));
            return new Guid(hash);
        }

        return Guid.Empty;
    }

    [HttpGet("users/search")]
    public async Task<ActionResult<IEnumerable<object>>> SearchUsers([FromQuery] string query)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            {
                return Ok(new List<object>());
            }

            var users = await _dbContext.Users
                .Where(u => u.Username.Contains(query) || u.Phone.Contains(query))
                .Take(10)
                .Select(u => new { u.Id, u.Username, u.Phone })
                .ToListAsync();

            return Ok(users);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error searching users");
            return StatusCode(500, "Error searching users");
        }
    }

    [HttpPost("discussions")]
    public async Task<ActionResult<DiscussionResponseDto>> CreateDiscussion([FromBody] CreateDiscussionDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest("Please provide both a title and content for your discussion");
            }

            if (dto.CategoryId == Guid.Empty)
            {
                return BadRequest("Please select a category for your discussion");
            }

            // Validate category exists
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == dto.CategoryId && c.IsActive);
            
            if (category == null)
            {
                return BadRequest("Selected category is not available. Please choose another category.");
            }

            // Get user identity from claims (supports GUID or int IDs)
            var userId = GetUserIdFromClaims();
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "User";

            var discussion = new Discussion
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Content = dto.Content,
                CategoryId = dto.CategoryId,
                CreatedByUserId = userId,
                CreatedByUsername = username,
                CreatedAt = DateTime.UtcNow,
                ModifiedAt = DateTime.UtcNow,
                ViewCount = 0,
                ReplyCount = 0,
                IsLocked = false,
                IsPinned = false
            };

            _context.Discussions.Add(discussion);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDiscussion), new { id = discussion.Id }, new DiscussionResponseDto
            {
                Id = discussion.Id,
                Title = discussion.Title,
                Content = discussion.Content,
                CategoryId = discussion.CategoryId,
                CategoryName = category.Name,
                CreatedByUserId = discussion.CreatedByUserId,
                CreatedByUsername = discussion.CreatedByUsername,
                CreatedAt = discussion.CreatedAt,
                ViewCount = discussion.ViewCount,
                ReplyCount = discussion.ReplyCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating discussion");
            return StatusCode(500, "Error creating discussion");
        }
    }

    [HttpGet("discussions/{id}")]
    public async Task<ActionResult<DiscussionResponseDto>> GetDiscussion(Guid id)
    {
        try
        {
            var discussion = await _context.Discussions
                .Include(d => d.Category)
                .FirstOrDefaultAsync(d => d.Id == id);

            if (discussion == null)
            {
                return NotFound();
            }

            // Increment view count
            discussion.ViewCount++;
            await _context.SaveChangesAsync();

            return Ok(new DiscussionResponseDto
            {
                Id = discussion.Id,
                Title = discussion.Title,
                Content = discussion.Content,
                CategoryId = discussion.CategoryId,
                CategoryName = discussion.Category?.Name ?? "",
                CreatedByUserId = discussion.CreatedByUserId,
                CreatedAt = discussion.CreatedAt,
                ViewCount = discussion.ViewCount,
                ReplyCount = discussion.ReplyCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting discussion {DiscussionId}", id);
            return StatusCode(500, "Error retrieving discussion");
        }
    }

    [HttpGet("discussions")]
    public async Task<ActionResult<IEnumerable<DiscussionResponseDto>>> GetAllDiscussions()
    {
        try
        {
            var discussions = await _context.Discussions
                .Include(d => d.Category)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
            
            var result = discussions.Select(d => new DiscussionResponseDto
            {
                Id = d.Id,
                Title = d.Title,
                Content = d.Content,
                CategoryId = d.CategoryId,
                CategoryName = d.Category?.Name ?? "",
                CreatedByUserId = d.CreatedByUserId,
                CreatedAt = d.CreatedAt,
                ViewCount = d.ViewCount,
                ReplyCount = d.ReplyCount
            });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting discussions");
            return StatusCode(500, "Error retrieving discussions");
        }
    }

    [HttpGet("categories/{categoryId}/discussions")]
    public async Task<ActionResult<IEnumerable<DiscussionResponseDto>>> GetCategoryDiscussions(Guid categoryId)
    {
        try
        {
            var category = await _context.Categories
                .FirstOrDefaultAsync(c => c.Id == categoryId);
            
            if (category == null)
            {
                return NotFound();
            }
            
            var discussions = await _context.Discussions
                .Where(d => d.CategoryId == categoryId)
                .Include(d => d.Category)
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();
            
            var result = discussions.Select(d => new DiscussionResponseDto
            {
                Id = d.Id,
                Title = d.Title,
                Content = d.Content,
                CategoryId = d.CategoryId,
                CategoryName = d.Category?.Name ?? "",
                CreatedByUserId = d.CreatedByUserId,
                CreatedAt = d.CreatedAt,
                ViewCount = d.ViewCount,
                ReplyCount = d.ReplyCount
            });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting category discussions for {CategoryId}", categoryId);
            return StatusCode(500, "Error retrieving discussions");
        }
    }

    [HttpGet("discussions/{discussionId}/posts")]
    public async Task<ActionResult<IEnumerable<PostResponseDto>>> GetDiscussionPosts(Guid discussionId)
    {
        try
        {
            var posts = await _context.Posts
                .Where(p => p.DiscussionId == discussionId)
                .Include(p => p.Discussion) // Include discussion to verify it exists
                .OrderBy(p => p.CreatedAt)
                .ToListAsync();
            
            var result = posts.Select(p => new PostResponseDto
            {
                Id = p.Id,
                Content = p.Content,
                DiscussionId = p.DiscussionId,
                ReplyToPostId = p.ReplyToPostId,
                CreatedByUserId = p.CreatedByUserId,
                CreatedByUsername = p.CreatedByUsername,
                CreatedByUserPhone = "User", // TODO: Link forum posts to actual user IDs (currently using Guid, but Users use int Id)
                CreatedAt = p.CreatedAt,
                LikeCount = p.LikeCount,
                HelpfulCount = p.HelpfulCount
            });
            
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting posts for discussion {DiscussionId}", discussionId);
            return StatusCode(500, "Error retrieving posts");
        }
    }

    [HttpPost("posts/{postId}/like")]
    public async Task<ActionResult> LikePost(Guid postId)
    {
        try
        {
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null)
            {
                return NotFound("Post not found or has been deleted");
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Please sign in to like posts");
            }

            var existingLike = await _context.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
            if (existingLike != null)
            {
                return Ok(new { likeCount = post.LikeCount, liked = true });
            }

            post.LikeCount += 1;
            _context.PostLikes.Add(new PostLike
            {
                Id = Guid.NewGuid(),
                PostId = postId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new { likeCount = post.LikeCount, liked = true });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error liking post {PostId}", postId);
            return StatusCode(500, "Error liking post");
        }
    }

    [HttpPost("posts/{postId}/unlike")]
    public async Task<ActionResult> UnlikePost(Guid postId)
    {
        try
        {
            var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == postId);
            if (post == null)
            {
                return NotFound("Post not found or has been deleted");
            }

            var userId = GetUserIdFromClaims();
            if (userId == Guid.Empty)
            {
                return Unauthorized("Please sign in to unlike posts");
            }

            var existingLike = await _context.PostLikes.FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);
            if (existingLike == null)
            {
                return Ok(new { likeCount = post.LikeCount, liked = false });
            }

            _context.PostLikes.Remove(existingLike);
            post.LikeCount = Math.Max(0, post.LikeCount - 1);

            await _context.SaveChangesAsync();

            return Ok(new { likeCount = post.LikeCount, liked = false });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unliking post {PostId}", postId);
            return StatusCode(500, "Error unliking post");
        }
    }

    [HttpPost("posts")]
    public async Task<ActionResult<PostResponseDto>> CreatePost([FromBody] CreatePostDto dto)
    {
        try
        {
            // Validate input
            if (string.IsNullOrWhiteSpace(dto.Content))
            {
                return BadRequest("Please enter your message before posting");
            }

            if (dto.DiscussionId == Guid.Empty)
            {
                return BadRequest("Discussion not found. Please try again.");
            }

            // Validate discussion exists and is not locked
            var discussion = await _context.Discussions
                .FirstOrDefaultAsync(d => d.Id == dto.DiscussionId);
            
            if (discussion == null)
            {
                return BadRequest("Discussion not found or has been removed");
            }

            // Get user identity from claims (supports GUID or int IDs)
            var userId = GetUserIdFromClaims();
            var username = User.FindFirst(ClaimTypes.Name)?.Value ?? "User";

            // Validate parent post when replying
            if (dto.ReplyToPostId.HasValue)
            {
                var parentPost = await _context.Posts.FirstOrDefaultAsync(p => p.Id == dto.ReplyToPostId.Value);
                if (parentPost == null || parentPost.DiscussionId != dto.DiscussionId)
                {
                    return BadRequest("Invalid parent post for reply");
                }
            }

            var post = new Post
            {
                Id = Guid.NewGuid(),
                Content = dto.Content,
                DiscussionId = dto.DiscussionId,
                ReplyToPostId = dto.ReplyToPostId,
                CreatedByUserId = userId,
                CreatedByUsername = username,
                CreatedAt = DateTime.UtcNow,
                ModifiedAt = DateTime.UtcNow,
                LikeCount = 0,
                HelpfulCount = 0,
                IsEdited = false
            };

            _context.Posts.Add(post);
            
            // Update discussion's reply count
            discussion.ReplyCount++;
            discussion.LastReplyAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();

            return Ok(new PostResponseDto
            {
                Id = post.Id,
                Content = post.Content,
                DiscussionId = post.DiscussionId,
                ReplyToPostId = post.ReplyToPostId,
                CreatedByUserId = post.CreatedByUserId,
                CreatedByUsername = post.CreatedByUsername,
                CreatedAt = post.CreatedAt,
                LikeCount = post.LikeCount,
                HelpfulCount = post.HelpfulCount
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating post");
            return StatusCode(500, "Error creating post");
        }
    }

    [HttpGet("notifications")]
    public async Task<ActionResult<IEnumerable<object>>> GetNotifications()
    {
        try
        {
            // Get current user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized();
            }

            if (!Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized();
            }

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .Take(20)
                .Select(n => new {
                    n.Id,
                    n.PostId,
                    n.DiscussionId,
                    n.CreatedAt,
                    n.Type,
                    n.Title,
                    n.Message
                })
                .ToListAsync();

            return Ok(notifications);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, "Error retrieving notifications");
        }
    }

    [HttpPost("notifications/{notificationId}/read")]
    public async Task<ActionResult> MarkNotificationAsRead(Guid notificationId)
    {
        try
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
            {
                return NotFound();
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, "Error updating notification");
        }
    }
}

public class CreateDiscussionDto
{
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
}

public class CreatePostDto
{
    public string Content { get; set; } = string.Empty;
    public Guid DiscussionId { get; set; }
    public Guid? ReplyToPostId { get; set; }
}

public class CategoryResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ModifiedAt { get; set; }
    public int DiscussionCount { get; set; }
}

public class DiscussionResponseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int ViewCount { get; set; }
    public int ReplyCount { get; set; }
}

public class PostResponseDto
{
    public Guid Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public Guid DiscussionId { get; set; }
    public Guid? ReplyToPostId { get; set; }
    public Guid CreatedByUserId { get; set; }
    public string CreatedByUsername { get; set; } = string.Empty;
    public string? CreatedByUserPhone { get; set; }
    public DateTime CreatedAt { get; set; }
    public int LikeCount { get; set; }
    public int HelpfulCount { get; set; }
}
