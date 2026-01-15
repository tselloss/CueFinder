using Xunit;
using Moq;
using CueFinder.Forum.Services;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Tests.Fixtures;
using CueFinder.Forum.Models;
using CueFinder.Forum.Events;
using MassTransit;

namespace CueFinder.Forum.Tests.Services;

public class PostServiceTests
{
    private readonly Mock<IPostRepository> _mockPostRepository;
    private readonly Mock<IDiscussionRepository> _mockDiscussionRepository;
    private readonly Mock<ILikeRepository> _mockLikeRepository;
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly PostService _service;

    public PostServiceTests()
    {
        _mockPostRepository = new Mock<IPostRepository>();
        _mockDiscussionRepository = new Mock<IDiscussionRepository>();
        _mockLikeRepository = new Mock<ILikeRepository>();
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        
        _service = new PostService(
            _mockPostRepository.Object,
            _mockDiscussionRepository.Object,
            _mockLikeRepository.Object,
            _mockPublishEndpoint.Object);
    }

    [Fact]
    public async Task CreatePostAsync_WithValidData_ShouldCreatePost()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var content = "Test Post Content";
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.Id = discussionId;

        _mockDiscussionRepository.Setup(r => r.GetByIdAsync(discussionId))
            .ReturnsAsync(discussion);
        _mockPostRepository.Setup(r => r.AddAsync(It.IsAny<Post>()))
            .ReturnsAsync((Post p) => p);
        _mockDiscussionRepository.Setup(r => r.UpdateAsync(It.IsAny<Discussion>()))
            .ReturnsAsync((Discussion d) => d);
        _mockPostRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreatePostAsync(discussionId, content, userId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(content, result.Content);
        Assert.Equal(discussionId, result.DiscussionId);
        Assert.Equal(userId, result.CreatedByUserId);
        Assert.Equal(1, discussion.ReplyCount);
    }

    [Fact]
    public async Task CreatePostAsync_OnLockedDiscussion_ShouldThrow()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var content = "Test Post Content";
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.IsLocked = true;

        _mockDiscussionRepository.Setup(r => r.GetByIdAsync(discussionId))
            .ReturnsAsync(discussion);

        // Act & Assert
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _service.CreatePostAsync(discussionId, content, userId));
    }

    [Fact]
    public async Task GetPostAsync_WithValidId_ShouldReturnPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var post = TestDataFactory.CreatePost();
        post.Id = postId;

        _mockPostRepository.Setup(r => r.GetWithMentionsAsync(postId))
            .ReturnsAsync(post);

        // Act
        var result = await _service.GetPostAsync(postId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(postId, result.Id);
    }

    [Fact]
    public async Task EditPostAsync_WithValidData_ShouldEditPost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var newContent = "Updated Content";
        var post = TestDataFactory.CreatePost();
        post.Id = postId;
        post.CreatedByUserId = userId;

        _mockPostRepository.Setup(r => r.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository.Setup(r => r.UpdateAsync(It.IsAny<Post>()))
            .ReturnsAsync((Post p) => p);
        _mockPostRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.EditPostAsync(postId, newContent, userId);

        // Assert
        Assert.Equal(newContent, post.Content);
        Assert.True(post.IsEdited);
    }

    [Fact]
    public async Task DeletePostAsync_ShouldSoftDeletePost()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = TestDataFactory.CreatePost();

        _mockPostRepository.Setup(r => r.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository.Setup(r => r.UpdateAsync(It.IsAny<Post>()))
            .ReturnsAsync((Post p) => p);
        _mockPostRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.DeletePostAsync(postId, userId, "Spam");

        // Assert
        Assert.NotNull(post.DeletedAt);
        Assert.Equal("Spam", post.DeletionReason);
    }

    [Fact]
    public async Task LikePostAsync_ShouldIncrementLikeCount()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = TestDataFactory.CreatePost();
        post.Id = postId;
        post.LikeCount = 0;

        _mockPostRepository.Setup(r => r.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockLikeRepository.Setup(r => r.GetLikeAsync(postId, userId))
            .ReturnsAsync((PostLike?)null);
        _mockLikeRepository.Setup(r => r.AddAsync(It.IsAny<PostLike>()))
            .ReturnsAsync((PostLike l) => l);
        _mockPostRepository.Setup(r => r.UpdateAsync(It.IsAny<Post>()))
            .ReturnsAsync((Post p) => p);
        _mockLikeRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.LikePostAsync(postId, userId);

        // Assert
        Assert.Equal(1, post.LikeCount);
    }

    [Fact]
    public async Task MarkAsHelpfulAsync_ShouldIncrementHelpfulCount()
    {
        // Arrange
        var postId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var post = TestDataFactory.CreatePost();
        post.HelpfulCount = 0;

        _mockPostRepository.Setup(r => r.GetByIdAsync(postId))
            .ReturnsAsync(post);
        _mockPostRepository.Setup(r => r.UpdateAsync(It.IsAny<Post>()))
            .ReturnsAsync((Post p) => p);
        _mockPostRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.MarkAsHelpfulAsync(postId, userId);

        // Assert
        Assert.Equal(1, post.HelpfulCount);
        _mockPublishEndpoint.Verify(p => p.Publish(It.IsAny<PostMarkedAsHelpfulEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDiscussionPostsAsync_ShouldReturnPosts()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var posts = new List<Post>
        {
            TestDataFactory.CreatePost(discussionId),
            TestDataFactory.CreatePost(discussionId)
        };

        _mockPostRepository.Setup(r => r.GetByDiscussionAsync(discussionId))
            .ReturnsAsync(posts);

        // Act
        var result = await _service.GetDiscussionPostsAsync(discussionId);

        // Assert
        Assert.NotEmpty(result);
        Assert.Equal(2, result.Count());
    }
}
