using CueFinder.Messages.Models;

namespace CueFinder.Messages.Services
{
    public interface IMessageService
    {
        Task<MessageResponseDto> SendMessageAsync(int senderId, SendMessageRequest request, bool isReply = false);
        Task<MessageResponseDto> ReplyToMessageAsync(int messageId, int senderId, string content);
        Task<bool> DeleteMessageAsync(int messageId, int userId);
        Task<List<MessageResponseDto>> GetInboxAsync(int userId, bool unreadOnly = false);
        Task<List<MessageResponseDto>> GetSentAsync(int userId);
        Task<List<MessageResponseDto>> GetThreadAsync(int userId, int otherUserId, int? cueId = null);
        Task<bool> MarkAsReadAsync(int messageId, int userId);

        /// <summary>
        /// Sends a read-only system notification from the platform (no human sender).
        /// </summary>
        Task SendSystemNotificationAsync(int recipientId, string subject, string content);
    }
}
