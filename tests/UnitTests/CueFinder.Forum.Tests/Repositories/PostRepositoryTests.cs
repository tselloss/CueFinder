using Xunit;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Tests.Fixtures;

namespace CueFinder.Forum.Tests.Repositories;

public class PostRepositoryTests : IDisposable
{
    private readonly ForumDbContextFixture _fixture;
    private readonly PostRepository _repository;

    public PostRepositoryTests()
    {
        _fixture = new ForumDbContextFixture();
        _repository = new PostRepository(_fixture.DbContext);
    }

    [Fact]
    public async Task AddPost_ShouldAddToDatabase()
    {
        // Arrange
        var post = TestDataFactory.CreatePost();

        // Act
        await _repository.AddAsync(post);
        await _repository.SaveChangesAsync();

        // Assert
        var result = await _repository.GetByIdAsync(post.Id);
        Assert.NotNull(result);
        Assert.Equal(post.Id, result.Id);
    }

    [Fact]
    public async Task GetByDiscussionAsync_ShouldReturnPostsByDiscussion()
    {
        // Arrange
        var discussionId = Guid.NewGuid();
        var post1 = TestDataFactory.CreatePost(discussionId);
        var post2 = TestDataFactory.CreatePost(discussionId);

        await _repository.AddAsync(post1);
        await _repository.AddAsync(post2);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetByDiscussionAsync(discussionId);

        // Assert
        Assert.Equal(2, results.Count());
        Assert.All(results, p => Assert.Equal(discussionId, p.DiscussionId));
    }

    [Fact]
    public async Task GetByUserAsync_ShouldReturnPostsByUser()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var post1 = TestDataFactory.CreatePost(userId: userId);
        var post2 = TestDataFactory.CreatePost(userId: userId);

        await _repository.AddAsync(post1);
        await _repository.AddAsync(post2);
        await _repository.SaveChangesAsync();

        // Act
        var results = await _repository.GetByUserAsync(userId);

        // Assert
        Assert.Equal(2, results.Count());
        Assert.All(results, p => Assert.Equal(userId, p.CreatedByUserId));
    }

    [Fact]
    public async Task GetPostCountByUserAsync_ShouldReturnCorrectCount()
    {
        // Arrange
        var userId = Guid.NewGuid();
        await _repository.AddAsync(TestDataFactory.CreatePost(userId: userId));
        await _repository.AddAsync(TestDataFactory.CreatePost(userId: userId));
        await _repository.SaveChangesAsync();

        // Act
        var count = await _repository.GetPostCountByUserAsync(userId);

        // Assert
        Assert.Equal(2, count);
    }

    [Fact]
    public async Task DeletePost_ShouldNotIncludeInResults()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var post = TestDataFactory.CreatePost(userId: userId);
        await _repository.AddAsync(post);
        await _repository.SaveChangesAsync();

        // Act
        post.DeletedAt = DateTime.UtcNow;
        await _repository.UpdateAsync(post);
        await _repository.SaveChangesAsync();

        // Assert
        var results = await _repository.GetByUserAsync(userId);
        Assert.Empty(results);
    }

    public void Dispose()
    {
        _fixture?.Dispose();
    }
}
