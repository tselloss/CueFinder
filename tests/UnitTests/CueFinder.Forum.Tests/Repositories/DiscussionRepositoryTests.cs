using Xunit;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Tests.Fixtures;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.Tests.Repositories;

public class DiscussionRepositoryTests : IDisposable
{
    private readonly ForumDbContextFixture _fixture;
    private readonly DiscussionRepository _repository;

    public DiscussionRepositoryTests()
    {
        _fixture = new ForumDbContextFixture();
        _repository = new DiscussionRepository(_fixture.DbContext);
    }

    [Fact]
    public async Task AddDiscussion_ShouldAddToDatabase()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();

        // Act
        await _repository.AddAsync(discussion);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(discussion.Id);
        Assert.NotNull(result);
        Assert.Equal(discussion.Id, result.Id);
    }

    [Fact]
    public async Task GetByCategoryAsync_ShouldReturnDiscussionsByCategory()
    {
        // Arrange
        var categoryId = Guid.NewGuid();
        var discussion1 = TestDataFactory.CreateDiscussion(categoryId);
        var discussion2 = TestDataFactory.CreateDiscussion(categoryId);
        var otherDiscussion = TestDataFactory.CreateDiscussion(Guid.NewGuid());

        await _repository.AddAsync(discussion1);
        await _repository.AddAsync(discussion2);
        await _repository.AddAsync(otherDiscussion);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetByCategoryAsync(categoryId);

        // Assert
        Assert.Equal(2, results.Count());
        Assert.All(results, d => Assert.Equal(categoryId, d.CategoryId));
    }

    [Fact]
    public async Task GetByUserAsync_ShouldReturnDiscussionsByUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var discussion1 = TestDataFactory.CreateDiscussion(userId: userId);
        var discussion2 = TestDataFactory.CreateDiscussion(userId: userId);

        await _repository.AddAsync(discussion1);
        await _repository.AddAsync(discussion2);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetByUserAsync(userId);

        // Assert
        Assert.Equal(2, results.Count());
        Assert.All(results, d => Assert.Equal(userId, d.CreatedByUserId));
    }

    [Fact]
    public async Task GetPinnedAsync_ShouldReturnPinnedDiscussionsOnly()
    {
        // Arrange
        var pinnedDiscussion = TestDataFactory.CreateDiscussion();
        pinnedDiscussion.IsPinned = true;
        var unpinnedDiscussion = TestDataFactory.CreateDiscussion();
        unpinnedDiscussion.IsPinned = false;

        await _repository.AddAsync(pinnedDiscussion);
        await _repository.AddAsync(unpinnedDiscussion);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetPinnedAsync();

        // Assert
        Assert.Single(results);
        Assert.All(results, d => Assert.True(d.IsPinned));
    }

    [Fact]
    public async Task SearchAsync_ShouldFindDiscussionsByTitle()
    {
        // Arrange
        var discussion = new Discussion
        {
            Title = "Unique Search Term Discussion",
            Content = "Content",
            CategoryId = Guid.NewGuid(),
            CreatedByUserId = Guid.NewGuid()
        };

        await _repository.AddAsync(discussion);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.SearchAsync("Unique Search");

        // Assert
        Assert.NotEmpty(results);
        Assert.Contains(discussion.Id, results.Select(d => d.Id));
    }

    [Fact]
    public async Task UpdateDiscussion_ShouldModifyDatabase()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();
        await _repository.AddAsync(discussion);
        await _repository.SaveChangesAsync();

        // Act
        discussion.Title = "Updated Title";
        await _repository.UpdateAsync(discussion);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(discussion.Id);
        Assert.Equal("Updated Title", result?.Title);
    }

    [Fact]
    public async Task DeleteDiscussion_ShouldRemoveFromDatabase()
    {
        // Arrange
        var discussion = TestDataFactory.CreateDiscussion();
        await _repository.AddAsync(discussion);
        await _repository.SaveChangesAsync();

        // Act
        await _repository.DeleteAsync(discussion.Id);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(discussion.Id);
        Assert.Null(result);
    }

    public void Dispose()
    {
        _fixture?.Dispose();
    }
}
