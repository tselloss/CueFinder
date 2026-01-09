using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;

namespace CueFinder.Database.IntegrationTests.Infrastructure
{
    /// <summary>
    /// Base class for database integration tests using Docker PostgreSQL
    /// </summary>
    public abstract class DatabaseTestBase : IDisposable
    {
        protected CueFinderDbContext Context { get; private set; }
        private readonly string _testDatabaseName;

        protected DatabaseTestBase()
        {
            // Generate unique database name for each test class
            _testDatabaseName = $"cuefinder_test_{Guid.NewGuid():N}";
            
            var host = Environment.GetEnvironmentVariable("TEST_DB_HOST") ?? "127.0.0.1";
            var port = Environment.GetEnvironmentVariable("TEST_DB_PORT") ?? "5433";
            var user = Environment.GetEnvironmentVariable("TEST_DB_USER") ?? "postgres";
            var password = Environment.GetEnvironmentVariable("TEST_DB_PASSWORD") ?? "admin";
            
            var connectionString = $"Host={host};Port={port};Database={_testDatabaseName};Username={user};Password={password};Ssl Mode=Disable;Trust Server Certificate=true;Include Error Detail=true";

            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseNpgsql(connectionString)
                .Options;

            Context = new CueFinderDbContext(options);
            Context.Database.EnsureCreated();
        }

        public void Dispose()
        {
            try
            {
                Context.Database.EnsureDeleted();
            }
            catch
            {
                // Ignore cleanup errors
            }
            finally
            {
                Context.Dispose();
            }
        }

        protected void ClearDatabase()
        {
            Context.Ratings.RemoveRange(Context.Ratings);
            Context.Messages.RemoveRange(Context.Messages);
            Context.Transactions.RemoveRange(Context.Transactions);
            Context.SavedCues.RemoveRange(Context.SavedCues);
            Context.CueImages.RemoveRange(Context.CueImages);
            Context.Cues.RemoveRange(Context.Cues);
            Context.Users.RemoveRange(Context.Users);
            Context.SaveChanges();
        }
    }
}
