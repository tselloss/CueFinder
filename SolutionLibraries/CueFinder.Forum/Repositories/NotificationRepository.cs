using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Repositories;

/// <summary>
/// Repository implementation for ForumNotification entity
/// </summary>
public class NotificationRepository : Repository<ForumNotification>, INotificationRepository
{
    public NotificationRepository(ForumDbContext context) : base(context) { }

    public async Task<IEnumerable<ForumNotification>> GetUnreadByUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<ForumNotification>> GetByUserAsync(Guid userId, int take = 50)
    {
        return await _dbSet
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(take)
            .ToListAsync();
    }

    public async Task MarkAsReadAsync(Guid notificationId)
    {
        var notification = await GetByIdAsync(notificationId);
        if (notification != null)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await UpdateAsync(notification);
            await SaveChangesAsync();
        }
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unreadNotifications = await _dbSet
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _dbSet
            .Where(n => n.UserId == userId && !n.IsRead)
            .CountAsync();
    }
}
