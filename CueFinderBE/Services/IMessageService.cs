using CueFinderBE.Models.Messages;

namespace CueFinderBE.Services
{
    public interface IMessageService
    {
        Task<MessageResponseDto> SendMessageAsync(int senderId, SendMessageRequest request);
        Task<List<MessageResponseDto>> GetInboxAsync(int userId, bool unreadOnly = false);
        Task<List<MessageResponseDto>> GetSentAsync(int userId);
        Task<List<MessageResponseDto>> GetThreadAsync(int userId, int otherUserId, int? cueId = null);
        Task<bool> MarkAsReadAsync(int messageId, int userId);
    }
}
