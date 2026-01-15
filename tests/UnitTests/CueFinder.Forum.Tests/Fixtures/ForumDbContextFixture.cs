using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Data;

namespace CueFinder.Forum.Tests.Fixtures;

/// <summary>
/// In-memory database fixture for testing
/// </summary>
public class ForumDbContextFixture : IDisposable
{
    private readonly DbContextOptions<ForumDbContext> _options;
    public ForumDbContext DbContext { get; }

    public ForumDbContextFixture()
    {
        _options = new DbContextOptionsBuilder<ForumDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        DbContext = new ForumDbContext(_options);
        DbContext.Database.EnsureCreated();
    }

    public void Dispose()
    {
        DbContext?.Dispose();
    }
}
