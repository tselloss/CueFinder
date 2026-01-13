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

        public async Task<MessageResponseDto> SendMessageAsync(int senderId, SendMessageRequest request)
        {
            if (senderId == request.RecipientId)
                throw new InvalidOperationException("You cannot message yourself.");

            var sender = await _context.Users.FindAsync(senderId) ?? throw new InvalidOperationException("Sender not found.");
            var recipient = await _context.Users.FindAsync(request.RecipientId) ?? throw new InvalidOperationException("Recipient not found.");

            Cue? cue = null;
            if (request.CueId.HasValue)
            {
                cue = await _context.Cues.FindAsync(request.CueId.Value) ?? throw new InvalidOperationException("Cue not found.");

                // If message is tied to a listing, enforce the recipient is the listing owner.
                if (cue.UserId != request.RecipientId)
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

        private static MessageResponseDto MapToDto(Message message, User? sender, User? recipient)
        {
            return new MessageResponseDto
            {
                Id = message.Id,
                SenderId = message.SenderId,
                SenderName = sender?.Name ?? string.Empty,
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
