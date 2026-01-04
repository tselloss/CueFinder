using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Database.Tests.Repositories
{
    public class CueRepositoryTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly CueRepository _repository;
        private readonly Mock<ILogger<CueRepository>> _mockLogger;

        public CueRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _mockLogger = new Mock<ILogger<CueRepository>>();
            _repository = new CueRepository(_context, _mockLogger.Object);
            
            // Create a test user for foreign key relationships
            var testUser = new User
            {
                Id = 1,
                Username = "testuser",
                PasswordHash = "hashed",
                Name = "Test User",
                Email = "test@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(testUser);
            _context.SaveChanges();
        }

        [Fact]
        public async Task GetActiveCuesAsync_ReturnsOnlyNonSoldCues()
        {
            // Arrange
            var activeCue = CreateTestCue("Active Cue");
            var soldCue = CreateTestCue("Sold Cue");
            soldCue.IsSold = true;

            await _context.Cues.AddRangeAsync(activeCue, soldCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetActiveCuesAsync(1, 10);

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Be("Active Cue");
            result.First().IsSold.Should().BeFalse();
        }

        [Fact]
        public async Task GetActiveCuesAsync_WithPagination_ReturnsCorrectPage()
        {
            // Arrange
            for (int i = 1; i <= 25; i++)
            {
                var cue = CreateTestCue($"Cue {i}");
                await _context.Cues.AddAsync(cue);
            }
            await _context.SaveChangesAsync();

            // Act - Get page 2 with 10 items per page
            var result = await _repository.GetActiveCuesAsync(2, 10);

            // Assert
            result.Should().HaveCount(10);
        }

        [Fact]
        public async Task GetActiveCuesAsync_OrdersByCreatedAtDescending()
        {
            // Arrange
            var oldCue = CreateTestCue("Old Cue");
            oldCue.CreatedAt = DateTime.UtcNow.AddDays(-10);

            var newCue = CreateTestCue("New Cue");
            newCue.CreatedAt = DateTime.UtcNow;

            await _context.Cues.AddRangeAsync(oldCue, newCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetActiveCuesAsync(1, 10);

            // Assert
            result.First().Title.Should().Be("New Cue");
            result.Last().Title.Should().Be("Old Cue");
        }

        [Fact]
        public async Task GetCuesByUserAsync_ReturnsOnlyUserCues()
        {
            // Arrange
            var user1Cue = CreateTestCue("User 1 Cue");
            user1Cue.UserId = 1;

            var user2Cue = CreateTestCue("User 2 Cue");
            user2Cue.UserId = 2;

            await _context.Cues.AddRangeAsync(user1Cue, user2Cue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetCuesByUserAsync(1);

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Be("User 1 Cue");
            result.First().UserId.Should().Be(1);
        }

        [Fact]
        public async Task SearchCuesAsync_FindsCuesByTitle()
        {
            // Arrange
            var cue1 = CreateTestCue("Predator Cue");
            var cue2 = CreateTestCue("McDermott Cue");

            await _context.Cues.AddRangeAsync(cue1, cue2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.SearchCuesAsync("Predator", 1, 10);

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Be("Predator Cue");
        }

        [Fact]
        public async Task SearchCuesAsync_FindsCuesByBrand()
        {
            // Arrange
            var cue1 = CreateTestCue("Beautiful Cue");
            cue1.Brand = "Predator";

            var cue2 = CreateTestCue("Another Cue");
            cue2.Brand = "McDermott";

            await _context.Cues.AddRangeAsync(cue1, cue2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.SearchCuesAsync("Predator", 1, 10);

            // Assert
            result.Should().HaveCount(1);
            result.First().Brand.Should().Be("Predator");
        }

        [Fact]
        public async Task SearchCuesAsync_IsCaseInsensitive()
        {
            // Arrange
            var cue = CreateTestCue("Predator Cue");
            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.SearchCuesAsync("predator", 1, 10);

            // Assert
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task SearchCuesAsync_DoesNotReturnSoldCues()
        {
            // Arrange
            var activeCue = CreateTestCue("Predator Active");
            var soldCue = CreateTestCue("Predator Sold");
            soldCue.IsSold = true;

            await _context.Cues.AddRangeAsync(activeCue, soldCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.SearchCuesAsync("Predator", 1, 10);

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Be("Predator Active");
        }

        [Fact]
        public async Task GetCuesByBrandAsync_ReturnsCorrectBrand()
        {
            // Arrange
            var predatorCue = CreateTestCue("Predator 1");
            predatorCue.Brand = "Predator";

            var mcdermottCue = CreateTestCue("McDermott 1");
            mcdermottCue.Brand = "McDermott";

            await _context.Cues.AddRangeAsync(predatorCue, mcdermottCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetCuesByBrandAsync("Predator");

            // Assert
            result.Should().HaveCount(1);
            result.First().Brand.Should().Be("Predator");
        }

        [Fact]
        public async Task GetRecentCuesAsync_ReturnsSpecifiedCount()
        {
            // Arrange
            for (int i = 1; i <= 30; i++)
            {
                var cue = CreateTestCue($"Cue {i}");
                await _context.Cues.AddAsync(cue);
            }
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetRecentCuesAsync(10);

            // Assert
            result.Should().HaveCount(10);
        }

        [Fact]
        public async Task GetTotalActiveCuesCountAsync_ReturnsCorrectCount()
        {
            // Arrange
            var activeCue1 = CreateTestCue("Active 1");
            var activeCue2 = CreateTestCue("Active 2");
            var soldCue = CreateTestCue("Sold");
            soldCue.IsSold = true;

            await _context.Cues.AddRangeAsync(activeCue1, activeCue2, soldCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetTotalActiveCuesCountAsync();

            // Assert
            result.Should().Be(2);
        }

        [Fact]
        public async Task AddAsync_AddsCueToDatabase()
        {
            // Arrange
            var cue = CreateTestCue("New Cue");

            // Act
            var result = await _repository.AddAsync(cue);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            _context.Cues.Should().Contain(c => c.Title == "New Cue");
        }

        [Fact]
        public async Task UpdateAsync_UpdatesCueInDatabase()
        {
            // Arrange
            var cue = CreateTestCue("Original Title");
            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();

            // Act
            cue.Title = "Updated Title";
            cue.Price = 999.99m;
            var result = await _repository.UpdateAsync(cue);

            // Assert
            result.Title.Should().Be("Updated Title");
            result.Price.Should().Be(999.99m);
            var updatedCue = await _context.Cues.FindAsync(cue.Id);
            updatedCue!.Title.Should().Be("Updated Title");
        }

        [Fact]
        public async Task DeleteAsync_RemovesCueFromDatabase()
        {
            // Arrange
            var cue = CreateTestCue("Delete Me");
            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();
            var cueId = cue.Id;

            // Act
            var result = await _repository.DeleteAsync(cueId);

            // Assert
            result.Should().BeTrue();
            var deletedCue = await _context.Cues.FindAsync(cueId);
            deletedCue.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_WithExistingId_ReturnsCue()
        {
            // Arrange
            var cue = CreateTestCue("Test Cue");
            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(cue.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(cue.Id);
            result.Title.Should().Be("Test Cue");
        }

        private Cue CreateTestCue(string title)
        {
            return new Cue
            {
                Title = title,
                Brand = "TestBrand",
                Description = "Test description",
                Price = 500.00m,
                Location = "Test Location",
                Condition = "Excellent",
                UserId = 1,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
