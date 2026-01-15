using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;

namespace CueFinder.Forum.Services;

/// <summary>
/// Service for managing forum notifications
/// </summary>
public interface IForumNotificationService
{
    Task<ForumNotification> CreateNotificationAsync(Guid userId, string type, string title, string message, Guid? discussionId = null, Guid? postId = null);
    Task<IEnumerable<ForumNotification>> GetUserNotificationsAsync(Guid userId, int take = 50);
    Task<IEnumerable<ForumNotification>> GetUnreadNotificationsAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task MarkAsReadAsync(Guid notificationId);
    Task MarkAllAsReadAsync(Guid userId);
    Task DeleteOldNotificationsAsync(int daysOld = 30);
}

public class ForumNotificationService : IForumNotificationService
{
    private readonly INotificationRepository _notificationRepository;

    public ForumNotificationService(INotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<ForumNotification> CreateNotificationAsync(
        Guid userId,
        string type,
        string title,
        string message,
        Guid? discussionId = null,
        Guid? postId = null)
    {
        var notification = new ForumNotification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Message = message,
            DiscussionId = discussionId,
            PostId = postId,
            ExpiresAt = DateTime.UtcNow.AddDays(30)
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        return notification;
    }

    public async Task<IEnumerable<ForumNotification>> GetUserNotificationsAsync(Guid userId, int take = 50)
    {
        return await _notificationRepository.GetByUserAsync(userId, take);
    }

    public async Task<IEnumerable<ForumNotification>> GetUnreadNotificationsAsync(Guid userId)
    {
        return await _notificationRepository.GetUnreadByUserAsync(userId);
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _notificationRepository.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        await _notificationRepository.MarkAsReadAsync(notificationId);
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId);
    }

    public async Task DeleteOldNotificationsAsync(int daysOld = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);
        var oldNotifications = await _notificationRepository.FindAsync(
            n => n.CreatedAt < cutoffDate && n.IsRead
        );

        foreach (var notification in oldNotifications)
        {
            await _notificationRepository.DeleteAsync(notification.Id);
        }

        await _notificationRepository.SaveChangesAsync();
    }
}
