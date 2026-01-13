using CueFinder.Messages.Models;
using CueFinder.Messages.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace CueFinder.Messages.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;
        private readonly ILogger<MessagesController> _logger;

        public MessagesController(IMessageService messageService, ILogger<MessagesController> logger)
        {
            _messageService = messageService;
            _logger = logger;
        }

        [HttpPost]
        [ProducesResponseType(typeof(MessageResponseDto), StatusCodes.Status200OK)]
        public async Task<ActionResult<MessageResponseDto>> SendMessage([FromBody] SendMessageRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                var senderId = GetCurrentUserId();
                var message = await _messageService.SendMessageAsync(senderId, request);
                return Ok(message);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Validation error sending message");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending message");
                return StatusCode(500, new { message = "Error sending message", error = ex.Message });
            }
        }

        [HttpGet("inbox")]
        [ProducesResponseType(typeof(List<MessageResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<MessageResponseDto>>> GetInbox([FromQuery] bool unreadOnly = false)
        {
            try
            {
                var userId = GetCurrentUserId();
                var messages = await _messageService.GetInboxAsync(userId, unreadOnly);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading inbox");
                return StatusCode(500, new { message = "Error loading inbox", error = ex.Message });
            }
        }

        [HttpGet("sent")]
        [ProducesResponseType(typeof(List<MessageResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<MessageResponseDto>>> GetSent()
        {
            try
            {
                var userId = GetCurrentUserId();
                var messages = await _messageService.GetSentAsync(userId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading sent messages");
                return StatusCode(500, new { message = "Error loading sent messages", error = ex.Message });
            }
        }

        [HttpGet("thread/{otherUserId}")]
        [ProducesResponseType(typeof(List<MessageResponseDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<List<MessageResponseDto>>> GetThread(int otherUserId, [FromQuery] int? cueId = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                var messages = await _messageService.GetThreadAsync(userId, otherUserId, cueId);
                return Ok(messages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading message thread with {OtherUserId}", otherUserId);
                return StatusCode(500, new { message = "Error loading message thread", error = ex.Message });
            }
        }

        [HttpPost("{id}/read")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updated = await _messageService.MarkAsReadAsync(id, userId);

                if (!updated)
                    return NotFound(new { message = "Message not found" });

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking message {MessageId} as read", id);
                return StatusCode(500, new { message = "Error marking message as read", error = ex.Message });
            }
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("User ID not found in token");

            return userId;
        }
    }
}
