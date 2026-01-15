using Xunit;
using CueFinder.Forum.Models;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Models;

public class PostTests
{
    [Fact]
    public void CreatePost_WithValidData_ShouldInitializeCorrectly()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();

        // Act
        var post = TestDataFactory.CreatePost(discussionId, userId);

        // Assert
        Assert.NotEqual(Guid.Empty, post.Id);
        Assert.Equal("Test Post Content", post.Content);
        Assert.Equal(discussionId, post.DiscussionId);
        Assert.Equal(userId, post.CreatedByUserId);
        Assert.False(post.IsEdited);
        Assert.Null(post.DeletedAt);
        Assert.Equal(0, post.LikeCount);
        Assert.Equal(0, post.HelpfulCount);
    }

    [Fact]
    public void Post_ShouldHaveEmptyCollections_OnCreation()
    {
        // Act
        var post = TestDataFactory.CreatePost();

        // Assert
        Assert.Empty(post.Likes);
        Assert.Empty(post.Mentions);
        Assert.Empty(post.Replies);
    }

    [Fact]
    public void Post_CanBeEdited()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();
        var newContent = "Updated Content";

        // Act
        post.Content = newContent;
        post.IsEdited = true;

        // Assert
        Assert.Equal(newContent, post.Content);
        Assert.True(post.IsEdited);
    }

    [Fact]
    public void Post_CanBeDeleted()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();
        var now = DateTime.UtcNow;

        // Act
        post.DeletedAt = now;
        post.DeletionReason = "Spam";

        // Assert
        Assert.NotNull(post.DeletedAt);
        Assert.Equal("Spam", post.DeletionReason);
    }

    [Fact]
    public void Post_LikeCountCanBeIncremented()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();

        // Act
        post.LikeCount++;

        // Assert
        Assert.Equal(1, post.LikeCount);
    }

    [Fact]
    public void Post_HelpfulCountCanBeIncremented()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();

        // Act
        post.HelpfulCount++;

        // Assert
        Assert.Equal(1, post.HelpfulCount);
    }

    [Fact]
    public void Post_CanHaveReplyToPost()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();
        var replyToPostId = Guid.NewGuid();

        // Act
        post.ReplyToPostId = replyToPostId;

        // Assert
        Assert.Equal(replyToPostId, post.ReplyToPostId);
    }
}
