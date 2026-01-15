using Xunit;
using Moq;
using CueFinder.Forum.Services;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Tests.Fixtures;
using CueFinder.Forum.Models;
using CueFinder.Forum.Events;
using MassTransit;

namespace CueFinder.Forum.Tests.Services;

public class DiscussionServiceTests
{
    private readonly Mock<IDiscussionRepository> _mockRepository;
    private readonly Mock<IPublishEndpoint> _mockPublishEndpoint;
    private readonly DiscussionService _service;

    public DiscussionServiceTests()
    {
        _mockRepository = new Mock<IDiscussionRepository>();
        _mockPublishEndpoint = new Mock<IPublishEndpoint>();
        _service = new DiscussionService(_mockRepository.Object, _mockPublishEndpoint.Object);
    }

    [Fact]
    public async Task CreateDiscussionAsync_WithValidData_ShouldCreateDiscussion()
    {
        // Arrange
        var title = "Test Discussion";
        var content = "Test Content";
        var userId = Guid.NewGuid();
        var categoryId = Guid.NewGuid();

        _mockRepository.Setup(r => r.AddAsync(It.IsAny<Discussion>()))
            .ReturnsAsync((Discussion d) => d);
        _mockRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        var result = await _service.CreateDiscussionAsync(title, content, userId, categoryId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(title, result.Title);
        Assert.Equal(content, result.Content);
        Assert.Equal(userId, result.CreatedByUserId);
        Assert.Equal(categoryId, result.CategoryId);
        _mockRepository.Verify(r => r.AddAsync(It.IsAny<Discussion>()), Times.Once);
        _mockRepository.Verify(r => r.SaveChangesAsync(), Times.Once);
        _mockPublishEndpoint.Verify(p => p.Publish(It.IsAny<DiscussionCreatedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetDiscussionAsync_WithValidId_ShouldReturnDiscussion()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.Id = discussionId;

        _mockRepository.Setup(r => r.GetWithPostsAsync(discussionId))
            .ReturnsAsync(discussion);

        // Act
        var result = await _service.GetDiscussionAsync(discussionId);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(discussionId, result.Id);
    }

    [Fact]
    public async Task PinDiscussionAsync_ShouldSetIsPinned()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.Id = discussionId;
        discussion.IsPinned = false;

        _mockRepository.Setup(r => r.GetByIdAsync(discussionId))
            .ReturnsAsync(discussion);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Discussion>()))
            .ReturnsAsync((Discussion d) => d);
        _mockRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.PinDiscussionAsync(discussionId, userId);

        // Assert
        Assert.True(discussion.IsPinned);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Discussion>()), Times.Once);
        _mockPublishEndpoint.Verify(p => p.Publish(It.IsAny<DiscussionPinnedEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task LockDiscussionAsync_ShouldSetIsLocked()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.Id = discussionId;
        discussion.IsLocked = false;

        _mockRepository.Setup(r => r.GetByIdAsync(discussionId))
            .ReturnsAsync(discussion);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Discussion>()))
            .ReturnsAsync((Discussion d) => d);
        _mockRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.LockDiscussionAsync(discussionId, userId, "Spam");

        // Assert
        Assert.True(discussion.IsLocked);
        _mockRepository.Verify(r => r.UpdateAsync(It.IsAny<Discussion>()), Times.Once);
    }

    [Fact]
    public async Task IncrementViewCountAsync_ShouldIncreaseViewCount()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var discussion = TestDataFactory.CreateDiscussion();
        discussion.ViewCount = 0;

        _mockRepository.Setup(r => r.GetByIdAsync(discussionId))
            .ReturnsAsync(discussion);
        _mockRepository.Setup(r => r.UpdateAsync(It.IsAny<Discussion>()))
            .ReturnsAsync((Discussion d) => d);
        _mockRepository.Setup(r => r.SaveChangesAsync())
            .ReturnsAsync(1);

        // Act
        await _service.IncrementViewCountAsync(discussionId, userId);

        // Assert
        Assert.Equal(1, discussion.ViewCount);
    }

    [Fact]
    public async Task GetCategoryDiscussionsAsync_ShouldReturnDiscussions()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var discussions = new List<Discussion>
        {
            TestDataFactory.CreateDiscussion(categoryId),
            TestDataFactory.CreateDiscussion(categoryId)
        };

        _mockRepository.Setup(r => r.GetByCategoryAsync(categoryId))
            .ReturnsAsync(discussions);

        // Act
        var result = await _service.GetCategoryDiscussionsAsync(categoryId);

        // Assert
        Assert.NotEmpty(result);
        Assert.Equal(2, result.Count());
    }
}
