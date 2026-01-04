using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace CueFinder.Database.IntegrationTests.Infrastructure
{
    /// <summary>
    /// Base class for database integration tests using Docker PostgreSQL
    /// </summary>
    public abstract class DatabaseTestBase : IDisposable
    {
        private CueFinderDbContext? _context;
        protected CueFinderDbContext Context => _context ?? throw new InvalidOperationException("Context not initialized. Call InitializeAsync first.");
        private readonly string _testDatabaseName;
        private bool _initialized = false;

        protected DatabaseTestBase()
        {
            // Generate unique database name for each test class
            _testDatabaseName = $"cuefinder_test_{Guid.NewGuid():N}";
        }

        protected void InitializeDatabase()
        {
            if (_initialized) return;

            try
            {
                // Build configuration
                var configuration = new ConfigurationBuilder()
                    .AddInMemoryCollection(new Dictionary<string, string>
                    {
                        { "ConnectionStrings:DefaultConnection", GetConnectionString() }
                    }!)
                    .Build();

                // Create DbContext with PostgreSQL
                var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                    .UseNpgsql(GetConnectionString())
                    .Options;

                _context = new CueFinderDbContext(options);

                // Create database and apply migrations
                _context.Database.EnsureCreated();
                _initialized = true;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException(
                    $"Failed to connect to PostgreSQL. Make sure Docker container is running on the correct port. Error: {ex.Message}", ex);
            }
        }

        private string GetConnectionString()
        {
            // Check if test database container is running
            var host = Environment.GetEnvironmentVariable("TEST_DB_HOST") ?? "localhost";
            var port = Environment.GetEnvironmentVariable("TEST_DB_PORT") ?? "5432"; // Changed from 5433 to 5432
            var user = Environment.GetEnvironmentVariable("TEST_DB_USER") ?? "postgres";
            var password = Environment.GetEnvironmentVariable("TEST_DB_PASSWORD") ?? "postgres";
            
            return $"Host={host};Port={port};Database={_testDatabaseName};Username={user};Password={password};Include Error Detail=true";
        }

        public void Dispose()
        {
            // Clean up: Drop the test database
            if (_context != null)
            {
                try
                {
                    _context.Database.EnsureDeleted();
                }
                catch
                {
                    // Ignore cleanup errors
                }
                finally
                {
                    _context.Dispose();
                }
            }
        }

        /// <summary>
        /// Clear all data from the database between tests
        /// </summary>
        protected void ClearDatabase()
        {
            if (_context == null) return;
            
            _context.Ratings.RemoveRange(_context.Ratings);
            _context.Messages.RemoveRange(_context.Messages);
            _context.Transactions.RemoveRange(_context.Transactions);
            _context.SavedCues.RemoveRange(_context.SavedCues);
            _context.CueImages.RemoveRange(_context.CueImages);
            _context.Cues.RemoveRange(_context.Cues);
            _context.Users.RemoveRange(_context.Users);
            _context.SaveChanges();
        }
    }
}
