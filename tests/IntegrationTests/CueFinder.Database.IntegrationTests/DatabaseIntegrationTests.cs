using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using CueFinder.Database.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;

namespace CueFinder.Database.IntegrationTests
{
    /// <summary>
    /// Integration tests using real PostgreSQL database from Docker
    /// </summary>
    public class DatabaseIntegrationTests : DatabaseTestBase
    {
        private UserRepository _userRepository = null!;
        private CueRepository _cueRepository = null!;
        private UserService _userService = null!;
        private CueService _cueService = null!;

        public DatabaseIntegrationTests() : base()
        {
            // Defer DB init to test methods to avoid constructor-time failures during discovery
        }

        private void EnsureInit()
        {
            if (_userService != null) return; // Already initialized
            
            // Database is already initialized by DatabaseTestBase constructor
            
            var userRepoLogger = new TestLogger<UserRepository>();
            var cueRepoLogger = new TestLogger<CueRepository>();
            var userServiceLogger = new TestLogger<UserService>();
            var cueServiceLogger = new TestLogger<CueService>();
            
            _userRepository = new UserRepository(Context, userRepoLogger);
            _cueRepository = new CueRepository(Context, cueRepoLogger);
            _userService = new UserService(_userRepository, Context, userServiceLogger);
            _cueService = new CueService(_cueRepository, Context, cueServiceLogger);
        }
        
        private UserService UserService => _userService ?? throw new InvalidOperationException("Not initialized");
        private CueService CueService => _cueService ?? throw new InvalidOperationException("Not initialized");
        private UserRepository UserRepository => _userRepository ?? throw new InvalidOperationException("Not initialized");
        private CueRepository CueRepository => _cueRepository ?? throw new InvalidOperationException("Not initialized");

        [Fact]
        public async Task CompleteUserLifecycle_CreateUpdateDelete_WorksCorrectly()
        {
            EnsureInit();
            // Step 1: Create user
            var user = new User
            {
                Username = "integrationuser",
                PasswordHash = "hashed_password",
                Name = "Integration User",
                Email = "integration@test.com",
                Phone = "555-1234",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Assert creation
            createdUser.Should().NotBeNull();
            createdUser.Id.Should().BeGreaterThan(0);
            createdUser.Username.Should().Be("integrationuser");

            // Step 2: Get user by username
            var retrievedUser = Require(await _userService.GetByUsernameAsync("integrationuser"), "retrievedUser");
            retrievedUser.Name.Should().Be("Integration User");

            // Step 3: Update user
            retrievedUser.Name = "Updated Integration User";
            retrievedUser.Email = "updated@test.com";
            var updatedUser = Require(await _userService.UpdateUserAsync(retrievedUser), "updatedUser");

            // Assert update
            updatedUser.Name.Should().Be("Updated Integration User");
            updatedUser.Email.Should().Be("updated@test.com");

            // Verify in database
            var userFromDb = Require(await _userService.GetByUsernameAsync("integrationuser"), "userFromDb");
            userFromDb.Name.Should().Be("Updated Integration User");

            // Step 4: Delete user
            var deleteResult = await _userService.DeleteUserAsync(createdUser.Id);
            deleteResult.Should().BeTrue();

            // Verify deletion
            var deletedUser = await _userService.GetUserWithDetailsAsync(createdUser.Id);
            deletedUser.Should().BeNull();
        }

        [Fact]
        public async Task CompleteCueLifecycle_CreateUpdateMarkSoldDelete_WorksCorrectly()
        {
            EnsureInit();
            // Step 1: Create user first (required for foreign key)
            var user = new User
            {
                Username = "cueowner",
                PasswordHash = "hashed",
                Name = "Cue Owner",
                Email = "owner@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Step 2: Create cue
            var cue = new Cue
            {
                Title = "Integration Test Cue",
                Brand = "Predator",
                Description = "Test cue for integration testing",
                Price = 750.00m,
                Location = "Test City",
                Condition = "Excellent",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdCue = Require(await _cueService.CreateCueAsync(cue), "createdCue");

            // Assert creation
            createdCue.Should().NotBeNull();
            createdCue.Id.Should().BeGreaterThan(0);
            createdCue.Title.Should().Be("Integration Test Cue");

            // Step 3: Get cue with details
            var retrievedCue = Require(await _cueService.GetCueWithDetailsAsync(createdCue.Id), "retrievedCue");
            retrievedCue.User.Should().NotBeNull();
            retrievedCue.User!.Username.Should().Be("cueowner");

            // Step 4: Update cue
            retrievedCue.Price = 800.00m;
            retrievedCue.Title = "Updated Integration Test Cue";
            var updatedCue = Require(await _cueService.UpdateCueAsync(retrievedCue), "updatedCue");

            // Assert update
            updatedCue.Price.Should().Be(800.00m);
            updatedCue.Title.Should().Be("Updated Integration Test Cue");

            // Verify in database
            var cueFromDb = Require(await _cueService.GetCueWithDetailsAsync(createdCue.Id), "cueFromDb");
            cueFromDb.Price.Should().Be(800.00m);

            // Step 5: Mark as sold
            var markSoldResult = await _cueService.MarkAsSoldAsync(createdCue.Id);
            markSoldResult.Should().BeTrue();

            var soldCue = Require(await _cueService.GetCueWithDetailsAsync(createdCue.Id), "soldCue");
            soldCue.IsSold.Should().BeTrue();

            // Step 6: Delete cue
            var deleteResult = await _cueService.DeleteCueAsync(createdCue.Id);
            deleteResult.Should().BeTrue();

            // Verify deletion
            var deletedCue = await _cueService.GetCueWithDetailsAsync(createdCue.Id);
            deletedCue.Should().BeNull();
        }

        [Fact]
        public async Task UserCueRelationship_WithForeignKey_WorksCorrectly()
        {
            EnsureInit();
            // Create user
            var user = new User
            {
                Username = "multiuser",
                PasswordHash = "hashed",
                Name = "Multi Cue User",
                Email = "multi@test.com",
                Phone = "555-9999",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Create multiple cues for the same user
            var cue1 = new Cue
            {
                Title = "Cue 1",
                Brand = "Brand1",
                Description = "Description 1",
                Price = 500m,
                Location = "Location 1",
                Condition = "Good",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var cue2 = new Cue
            {
                Title = "Cue 2",
                Brand = "Brand2",
                Description = "Description 2",
                Price = 600m,
                Location = "Location 2",
                Condition = "Excellent",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _cueService.CreateCueAsync(cue1);
            await _cueService.CreateCueAsync(cue2);

            // Get user's cues
            var userCues = Require(await _cueService.GetUserCuesAsync(createdUser.Id), "userCues");

            // Assert
            userCues.Should().HaveCount(2);
            userCues.Should().Contain(c => c.Title == "Cue 1");
            userCues.Should().Contain(c => c.Title == "Cue 2");
            userCues.All(c => c.UserId == createdUser.Id).Should().BeTrue();
        }

        [Fact]
        public async Task SearchCues_WithPostgreSQLFullTextSearch_WorksCorrectly()
        {
            EnsureInit();
            // Create user
            var user = new User
            {
                Username = "searchuser",
                PasswordHash = "hashed",
                Name = "Search User",
                Email = "search@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Create cues with different brands
            var predatorCue = new Cue
            {
                Title = "Beautiful Predator Cue",
                Brand = "Predator",
                Description = "A high-quality Predator cue",
                Price = 1000m,
                Location = "New York",
                Condition = "Excellent",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var mcdermottCue = new Cue
            {
                Title = "McDermott Classic",
                Brand = "McDermott",
                Description = "Classic McDermott design",
                Price = 800m,
                Location = "Los Angeles",
                Condition = "Good",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _cueService.CreateCueAsync(predatorCue);
            await _cueService.CreateCueAsync(mcdermottCue);

            // Search by brand (case-insensitive)
            var searchResults = Require(await _cueService.SearchCuesAsync("predator", 1, 20), "searchResults");

            // Assert
            searchResults.Should().HaveCount(1);
            searchResults.First().Brand.Should().Be("Predator");

            // Search by title
            var titleSearch = Require(await _cueService.SearchCuesAsync("McDermott", 1, 20), "titleSearch");
            titleSearch.Should().HaveCount(1);
            titleSearch.First().Title.Should().Contain("McDermott");
        }

        [Fact]
        public async Task GetActiveCues_ExcludesSoldCues_InRealDatabase()
        {
            EnsureInit();
            // Create user
            var user = new User
            {
                Username = "activeuser",
                PasswordHash = "hashed",
                Name = "Active User",
                Email = "active@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Create active and sold cues
            var activeCue = new Cue
            {
                Title = "Active Cue",
                Brand = "Brand1",
                Description = "Active",
                Price = 500m,
                Location = "Location",
                Condition = "Good",
                UserId = createdUser.Id,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var soldCue = new Cue
            {
                Title = "Sold Cue",
                Brand = "Brand2",
                Description = "Sold",
                Price = 600m,
                Location = "Location",
                Condition = "Good",
                UserId = createdUser.Id,
                IsSold = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _cueService.CreateCueAsync(activeCue);
            await _cueService.CreateCueAsync(soldCue);

            // Get active cues
            var activeCues = Require(await _cueService.GetActiveCuesWithPaginationAsync(1, 20), "activeCues");

            // Assert - should only get active cue
            activeCues.Should().Contain(c => c.Title == "Active Cue");
            activeCues.Should().NotContain(c => c.Title == "Sold Cue");
            activeCues.Where(c => c.UserId == createdUser.Id).Should().HaveCount(1);
        }

        [Fact]
        public async Task Pagination_WorksWithRealDatabase()
        {
            EnsureInit();
            // Create user
            var user = new User
            {
                Username = "paginationuser",
                PasswordHash = "hashed",
                Name = "Pagination User",
                Email = "pagination@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

            // Create 25 cues
            for (int i = 1; i <= 25; i++)
            {
                var cue = new Cue
                {
                    Title = $"Pagination Cue {i}",
                    Brand = "TestBrand",
                    Description = $"Description {i}",
                    Price = 500m + i,
                    Location = "Test Location",
                    Condition = "Good",
                    UserId = createdUser.Id,
                    IsSold = false,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-i),
                    UpdatedAt = DateTime.UtcNow
                };
                await _cueService.CreateCueAsync(cue);
            }

            // Get total count
            var totalCount = await _cueService.GetActiveCuesCountAsync();
            totalCount.Should().BeGreaterOrEqualTo(25);

            // Get first page (10 items)
            var page1 = Require(await _cueService.GetActiveCuesWithPaginationAsync(1, 10), "page1");

            // Get second page (10 items)
            var page2 = Require(await _cueService.GetActiveCuesWithPaginationAsync(2, 10), "page2");

            // Assert pagination works
            page1.Should().HaveCount(10);
            page2.Should().HaveCount(10);

            // Verify no overlap between pages
            var page1Ids = page1.Select(c => c.Id).ToList();
            var page2Ids = page2.Select(c => c.Id).ToList();
            page1Ids.Intersect(page2Ids).Should().BeEmpty();
        }

        private static T Require<T>(T? value, string name) where T : class
        {
            return value ?? throw new InvalidOperationException($"Expected {name} to be non-null in test");
        }

    [Fact]
    public async Task ConcurrentOperations_HandleDatabaseLocking()
    {
        EnsureInit();
        // Create user
        var user = new User
        {
            Username = "concurrentuser",
            PasswordHash = "hashed",
            Name = "Concurrent User",
            Email = "concurrent@test.com",
            Phone = "555-0000",
            Role = "user",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdUser = Require(await _userService.CreateUserAsync(user), "createdUser");

        // Create multiple cues concurrently
        // Each operation needs its own DbContext instance to avoid thread-safety issues
        var tasks = new List<Task<Cue>>();
        for (int i = 1; i <= 10; i++)
        {
            // Capture loop variable
            var index = i;
            
            // Create a separate task that will use a new context instance
            tasks.Add(Task.Run(async () =>
            {
                // Create a new DbContext for this concurrent operation
                var contextOptions = new DbContextOptionsBuilder<CueFinderDbContext>()
                    .UseNpgsql(Context.Database.GetConnectionString())
                    .Options;
                    
                using var context = new CueFinderDbContext(contextOptions);
                var repositoryLogger = new TestLogger<CueRepository>();
                var repository = new CueRepository(context, repositoryLogger);
                var serviceLogger = new TestLogger<CueService>();
                var cueService = new CueService(repository, context, serviceLogger);
                
                var cue = new Cue
                {
                    Title = $"Concurrent Cue {index}",
                    Brand = "TestBrand",
                    Description = $"Concurrent test {index}",
                    Price = 500m,
                    Location = "Test Location",
                    Condition = "Good",
                    UserId = createdUser.Id,
                    IsSold = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                return await cueService.CreateCueAsync(cue);
            }));
        }

        var results = await Task.WhenAll(tasks);

        // Assert all cues were created
        results.Should().HaveCount(10);
        results.All(c => c.Id > 0).Should().BeTrue();

        // Verify in database
        var userCues = Require(await _cueService.GetUserCuesAsync(createdUser.Id), "userCues");
        userCues.Should().HaveCount(10);
    }        /// <summary>
        /// Test logger implementation for integration tests
        /// </summary>
        private class TestLogger<T> : ILogger<T>
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

            public bool IsEnabled(LogLevel logLevel) => false;

            public void Log<TState>(
                LogLevel logLevel,
                EventId eventId,
                TState state,
                Exception? exception,
                Func<TState, Exception?, string> formatter)
            {
                // No-op for tests
            }
        }
    }
}
