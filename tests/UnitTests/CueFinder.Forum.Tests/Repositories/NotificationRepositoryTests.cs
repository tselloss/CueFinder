using Xunit;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Repositories;

public class NotificationRepositoryTests : IDisposable
{
    private readonly ForumDbContextFixture _fixture;
    private readonly NotificationRepository _repository;

    public NotificationRepositoryTests()
    {
        _fixture = new ForumDbContextFixture();
        _repository = new NotificationRepository(_fixture.DbContext);
    }

    [Fact]
    public async Task AddNotification_ShouldAddToDatabase()
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();

        // Act
        await _repository.AddAsync(notification);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(notification.Id);
        Assert.NotNull(result);
        Assert.Equal(notification.Id, result.Id);
    }

    [Fact]
    public async Task GetUnreadByUserAsync_ShouldReturnUnreadNotifications()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var unreadNotification = TestDataFactory.CreateNotification(userId);
        unreadNotification.IsRead = false;
        var readNotification = TestDataFactory.CreateNotification(userId);
        readNotification.IsRead = true;

        await _repository.AddAsync(unreadNotification);
        await _repository.AddAsync(readNotification);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetUnreadByUserAsync(userId);

        // Assert
        Assert.Single(results);
        Assert.All(results, n => Assert.False(n.IsRead));
    }

    [Fact]
    public async Task GetByUserAsync_ShouldReturnNotificationsWithLimit()
    {
        // Arrange
        var userId = Guid.NewGuid();
        for (int i = 0; i < 100; i++)
        {
            await _repository.AddAsync(TestDataFactory.CreateNotification(userId));
        }
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetByUserAsync(userId, 50);

        // Assert
        Assert.Equal(50, results.Count());
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldUpdateNotificationStatus()
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();
        notification.IsRead = false;
        await _repository.AddAsync(notification);
        await _repository.SaveChangesAsync();

        // Act
        await _repository.MarkAsReadAsync(notification.Id);

        // Assert
        var result = await _repository.GetByIdAsync(notification.Id);
        Assert.True(result?.IsRead);
        Assert.NotNull(result?.ReadAt);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_ShouldMarkAllUserNotificationsAsRead()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notification1 = TestDataFactory.CreateNotification(userId);
        var notification2 = TestDataFactory.CreateNotification(userId);
        notification1.IsRead = false;
        notification2.IsRead = false;

        await _repository.AddAsync(notification1);
        await _repository.AddAsync(notification2);
        await _repository.SaveChangesAsync();

        // Act
        await _repository.MarkAllAsReadAsync(userId);

        // Assert
        var result1 = await _repository.GetByIdAsync(notification1.Id);
        var result2 = await _repository.GetByIdAsync(notification2.Id);
        Assert.True(result1?.IsRead);
        Assert.True(result2?.IsRead);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        for (int i = 0; i < 5; i++)
        {
            var notification = TestDataFactory.CreateNotification(userId);
            notification.IsRead = false;
            await _repository.AddAsync(notification);
        }
        await _repository.SaveChangesAsync();

        // Act
        var count = await _repository.GetUnreadCountAsync(userId);

        // Assert
        Assert.Equal(5, count);
    }

    public void Dispose()
    {
        _fixture?.Dispose();
    }
}
