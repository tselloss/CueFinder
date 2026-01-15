using Xunit;
using CueFinder.Forum.Models;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Models;

public class DiscussionTests
{
    [Fact]
    public void CreateDiscussion_WithValidData_ShouldInitializeCorrectly()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var discussion = TestDataFactory.CreateDiscussion(categoryId, userId);

        // Assert
        Assert.NotEqual(Guid.Empty, discussion.Id);
        Assert.Equal("Test Discussion", discussion.Title);
        Assert.Equal("Test Discussion Content", discussion.Content);
        Assert.Equal(categoryId, discussion.CategoryId);
        Assert.Equal(userId, discussion.CreatedByUserId);
        Assert.False(discussion.IsPinned);
        Assert.False(discussion.IsLocked);
        Assert.Equal(0, discussion.ViewCount);
        Assert.Equal(0, discussion.ReplyCount);
    }

    [Fact]
    public void Discussion_ShouldHaveEmptyCollections_OnCreation()
    {
        // Act
        var discussion = TestDataFactory.CreateDiscussion();

        // Assert
        Assert.Empty(discussion.Posts);
        Assert.Empty(discussion.Views);
        Assert.Empty(discussion.Subscriptions);
    }

    [Fact]
    public void Discussion_CanBePinned()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();

        // Act
        discussion.IsPinned = true;

        // Assert
        Assert.True(discussion.IsPinned);
    }

    [Fact]
    public void Discussion_CanBeLocked()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();

        // Act
        discussion.IsLocked = true;

        // Assert
        Assert.True(discussion.IsLocked);
    }

    [Fact]
    public void Discussion_ReplyCountCanBeIncremented()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.ReplyCount = 0;

        // Act
        discussion.ReplyCount++;

        // Assert
        Assert.Equal(1, discussion.ReplyCount);
    }

    [Fact]
    public void Discussion_ViewCountCanBeIncremented()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.ViewCount = 0;

        // Act
        discussion.ViewCount++;

        // Assert
        Assert.Equal(1, discussion.ViewCount);
    }

    [Fact]
    public void Discussion_LastReplyAtCanBeSet()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();
        var now = DateTime.UtcNow;

        // Act
        discussion.LastReplyAt = now;

        // Assert
        Assert.NotNull(discussion.LastReplyAt);
        Assert.True(Math.Abs((discussion.LastReplyAt.Value - now).TotalSeconds) < 1);
    }
}
