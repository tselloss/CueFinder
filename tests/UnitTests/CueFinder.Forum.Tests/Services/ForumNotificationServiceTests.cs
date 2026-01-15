using Xunit;
using Moq;
using CueFinder.Forum.Services;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Models;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Services;

public class ForumNotificationServiceTests
{
    private readonly Mock<INotificationRepository> _mockRepository;
    private readonly ForumNotificationService _service;

    public ForumNotificationServiceTests()
    {
        _mockRepository = new Mock<INotificationRepository>();
        _service = new ForumNotificationService(_mockRepository.Object);
    }

    [Fact]
    public async Task CreateNotificationAsync_WithValidData_ShouldCreateNotification()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var type = "ReplyAdded";
        var title = "New Reply";
        var message = "You have a new reply";

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<ForumNotification>()))
            .ReturnsAsync(TestDataFactory.CreateNotification(userId));
        _mockRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateNotificationAsync(userId, type, title, message);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(userId, result.UserId);
        Assert.Equal(type, result.Type);
    }

    [Fact]
    public async Task GetUserNotificationsAsync_ShouldReturnNotifications()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var notifications = new List<ForumNotification>
        {
            TestDataFactory.CreateNotification(userId),
            TestDataFactory.CreateNotification(userId)
        };

        _mockRepository.Setup(r => r.GetByUserAsync(userId, 50))
            .ReturnsAsync((IEnumerable<ForumNotification>)notifications);

        // Act
        var result = await _service.GetUserNotificationsAsync(userId, 50);

        // Assert
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task GetUnreadNotificationsAsync_ShouldReturnUnreadOnly()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var unreadNotifications = new List<ForumNotification>
        {
            TestDataFactory.CreateNotification(userId)
        };

        _mockRepository.Setup(r => r.GetUnreadByUserAsync(userId))
            .ReturnsAsync((IEnumerable<ForumNotification>)unreadNotifications);

        // Act
        var result = await _service.GetUnreadNotificationsAsync(userId);

        // Assert
        Assert.NotEmpty(result);
    }

    [Fact]
    public async Task GetUnreadCountAsync_ShouldReturnCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        _mockRepository.Setup(r => r.GetUnreadCountAsync(userId))
            .ReturnsAsync(5);

        // Act
        var result = await _service.GetUnreadCountAsync(userId);

        // Assert
        Assert.Equal(5, result);
    }

    [Fact]
    public async Task MarkAsReadAsync_ShouldMarkNotificationAsRead()
    {
        // Arrange
        var notificationId = Guid.NewGuid();

        _mockRepository.Setup(r => r.MarkAsReadAsync(notificationId))
            .Returns(Task.CompletedTask);

        // Act
        await _service.MarkAsReadAsync(notificationId);

        // Assert
        _mockRepository.Verify(r => r.MarkAsReadAsync(notificationId), Times.Once);
    }

    [Fact]
    public async Task MarkAllAsReadAsync_ShouldMarkAllUserNotificationsAsRead()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _mockRepository.Setup(r => r.MarkAllAsReadAsync(userId))
            .Returns(Task.CompletedTask);

        // Act
        await _service.MarkAllAsReadAsync(userId);

        // Assert
        _mockRepository.Verify(r => r.MarkAllAsReadAsync(userId), Times.Once);
    }
}
