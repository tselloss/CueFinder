using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Messages.Hubs;
using CueFinder.Messages.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Messages.Services
{
    public class MessageService : IMessageService
    {
        private readonly CueFinderDbContext _context;
        private readonly IHubContext<MessageHub> _hubContext;
        private readonly ILogger<MessageService> _logger;

        public MessageService(CueFinderDbContext context, IHubContext<MessageHub> hubContext, ILogger<MessageService> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        public async Task<MessageResponseDto> SendMessageAsync(int senderId, SendMessageRequest request, bool isReply = false)
        {
            if (senderId == request.RecipientId)
                throw new InvalidOperationException("You cannot message yourself.");

            var sender = await _context.Users.FindAsync(senderId) ?? throw new InvalidOperationException("Sender not found.");
            var recipient = await _context.Users.FindAsync(request.RecipientId) ?? throw new InvalidOperationException("Recipient not found.");

            Cue? cue = null;
            if (request.CueId.HasValue)
            {
                cue = await _context.Cues.FindAsync(request.CueId.Value) ?? throw new InvalidOperationException("Cue not found.");

                // If message is a new inquiry (not a reply), enforce the recipient is the listing owner.
                // For replies, any user can be the recipient since it's a conversation.
                if (!isReply && cue.UserId != request.RecipientId)
                    throw new InvalidOperationException("Recipient must be the listing owner for cue messages.");
            }

            var subject = string.IsNullOrWhiteSpace(request.Subject)
                ? (cue != null ? $"Inquiry about: {cue.Title}" : "Message")
                : request.Subject.Trim();

            var message = new Message
            {
                SenderId = senderId,
                RecipientId = request.RecipientId,
                CueId = request.CueId,
                Subject = subject,
                Content = request.Content.Trim(),
                MessageType = string.IsNullOrWhiteSpace(request.MessageType)
                    ? "message"
                    : request.MessageType.Trim().ToLowerInvariant(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var dto = MapToDto(message, sender, recipient);

            await _hubContext.Clients.Group($"user-{request.RecipientId}").SendAsync("ReceiveMessage", dto);

            _logger.LogInformation("Message {MessageId} sent from {SenderId} to {RecipientId}", message.Id, senderId, request.RecipientId);

            return dto;
        }

        public async Task<List<MessageResponseDto>> GetInboxAsync(int userId, bool unreadOnly = false)
        {
            var query = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Recipient)
                .Where(m => m.RecipientId == userId);

            if (unreadOnly)
            {
                query = query.Where(m => !m.IsRead);
            }

            query = query.OrderByDescending(m => m.CreatedAt);

            var messages = await query.ToListAsync();
            return messages.Select(m => MapToDto(m, m.Sender, m.Recipient)).ToList();
        }

        public async Task<List<MessageResponseDto>> GetSentAsync(int userId)
        {
            var messages = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Recipient)
                .Where(m => m.SenderId == userId)
                .OrderByDescending(m => m.CreatedAt)
                .ToListAsync();

            return messages.Select(m => MapToDto(m, m.Sender, m.Recipient)).ToList();
        }

        public async Task<List<MessageResponseDto>> GetThreadAsync(int userId, int otherUserId, int? cueId = null)
        {
            var messagesQuery = _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Recipient)
                .Where(m => (m.SenderId == userId && m.RecipientId == otherUserId) ||
                            (m.SenderId == otherUserId && m.RecipientId == userId));

            if (cueId.HasValue)
            {
                messagesQuery = messagesQuery.Where(m => m.CueId == cueId.Value);
            }

            var messages = await messagesQuery
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            return messages.Select(m => MapToDto(m, m.Sender, m.Recipient)).ToList();
        }

        public async Task<bool> MarkAsReadAsync(int messageId, int userId)
        {
            var message = await _context.Messages.FindAsync(messageId);
            if (message == null || message.RecipientId != userId)
            {
                return false;
            }

            if (message.IsRead)
            {
                return true;
            }

            message.IsRead = true;
            message.ReadAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<MessageResponseDto> ReplyToMessageAsync(int messageId, int senderId, string content)
        {
            // Get original message
            var originalMessage = await _context.Messages
                .Include(m => m.Sender)
                .Include(m => m.Recipient)
                .FirstOrDefaultAsync(m => m.Id == messageId);

            if (originalMessage == null)
                throw new InvalidOperationException("Original message not found.");

            if (originalMessage.IsSystem || !originalMessage.SenderId.HasValue)
                throw new InvalidOperationException("Cannot reply to system notifications.");

            // Verify the sender is part of the conversation (either sender or recipient of original)
            if (originalMessage.SenderId != senderId && originalMessage.RecipientId != senderId)
                throw new UnauthorizedAccessException("You are not part of this conversation.");

            // Determine who receives the reply
            int recipientId = originalMessage.SenderId == senderId
                ? originalMessage.RecipientId
                : originalMessage.SenderId.Value;

            // Create reply message
            var request = new SendMessageRequest
            {
                RecipientId = recipientId,
                CueId = originalMessage.CueId,
                Subject = originalMessage.Subject.StartsWith("Re:") 
                    ? originalMessage.Subject 
                    : $"Re: {originalMessage.Subject}",
                Content = content,
                MessageType = "message"
            };

            _logger.LogInformation("User {SenderId} replying to message {MessageId}", senderId, messageId);

            return await SendMessageAsync(senderId, request, isReply: true);
        }

        public async Task SendSystemNotificationAsync(int recipientId, string subject, string content)
        {
            var recipient = await _context.Users.FindAsync(recipientId)
                ?? throw new InvalidOperationException("Recipient not found.");

            var message = new Message
            {
                SenderId = null,
                IsSystem = true,
                RecipientId = recipientId,
                Subject = subject,
                Content = content,
                MessageType = "notification",
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            var dto = MapToDto(message, null, recipient);
            await _hubContext.Clients.Group($"user-{recipientId}").SendAsync("ReceiveMessage", dto);

            _logger.LogInformation("System notification sent to user {RecipientId}: {Subject}", recipientId, subject);
        }

        public async Task<bool> DeleteMessageAsync(int messageId, int userId)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null)
                return false;

            // Only sender or recipient can delete
            if (message.SenderId != userId && message.RecipientId != userId)
                throw new UnauthorizedAccessException("You do not have permission to delete this message.");

            _context.Messages.Remove(message);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Message {MessageId} deleted by user {UserId}", messageId, userId);

            return true;
        }

        private static MessageResponseDto MapToDto(Message message, User? sender, User? recipient)
        {
            return new MessageResponseDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = message.IsSystem ? "CueFinder" : (sender?.Name ?? string.Empty),
                IsSystem = message.IsSystem,
                RecipientId = message.RecipientId,
                RecipientName = recipient?.Name ?? string.Empty,
                CueId = message.CueId,
                Subject = message.Subject,
                Content = message.Content,
                MessageType = message.MessageType,
                IsRead = message.IsRead,
                ReadAt = message.ReadAt,
                CreatedAt = message.CreatedAt
            };
        }
    }
}
