using Xunit;
using CueFinder.Forum.Models;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Models;

public class ForumNotificationTests
{
    [Fact]
    public void CreateNotification_WithValidData_ShouldInitializeCorrectly()
    {
        // Arrange
        var userId = Guid.NewGuid();

        // Act
        var notification = TestDataFactory.CreateNotification(userId);

        // Assert
        Assert.NotEqual(Guid.Empty, notification.Id);
        Assert.Equal(userId, notification.UserId);
        Assert.Equal("ReplyAdded", notification.Type);
        Assert.Equal("Test Notification", notification.Title);
        Assert.Equal("Test Message", notification.Message);
        Assert.False(notification.IsRead);
        Assert.Null(notification.ReadAt);
    }

    [Fact]
    public void Notification_CanBeMarkedAsRead()
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();

        // Act
        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;

        // Assert
        Assert.True(notification.IsRead);
        Assert.NotNull(notification.ReadAt);
    }

    [Fact]
    public void Notification_CanHaveExpiration()
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();
        var expiryDate = DateTime.UtcNow.AddDays(30);

        // Act
        notification.ExpiresAt = expiryDate;

        // Assert
        Assert.Equal(expiryDate, notification.ExpiresAt);
    }

    [Fact]
    public void Notification_CanLinkToDiscussionAndPost()
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();
        var discussionId = Guid.NewGuid();
        var postId = Guid.NewGuid();

        // Act
        notification.DiscussionId = discussionId;
        notification.PostId = postId;

        // Assert
        Assert.Equal(discussionId, notification.DiscussionId);
        Assert.Equal(postId, notification.PostId);
    }

    [Theory]
    [InlineData("ReplyAdded")]
    [InlineData("Mentioned")]
    [InlineData("PostLiked")]
    [InlineData("DiscussionLocked")]
    public void Notification_CanHaveDifferentTypes(string type)
    {
        // Arrange
        var notification = TestDataFactory.CreateNotification();

        // Act
        notification.Type = type;

        // Assert
        Assert.Equal(type, notification.Type);
    }
}
