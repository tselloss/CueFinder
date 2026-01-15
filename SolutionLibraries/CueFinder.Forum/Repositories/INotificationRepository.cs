using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository interface for ForumNotification entity
/// </summary>
public interface INotificationRepository : IRepository<ForumNotification>
{
    Task<IEnumerable<ForumNotification>> GetUnreadByUserAsync(Guid userId);
    Task<IEnumerable<ForumNotification>> GetByUserAsync(Guid userId, int take = 50);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
}
