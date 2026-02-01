using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Database.Tests.Services
{
    public class CueServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ICueRepository> _mockRepository;
        private readonly Mock<ILogger<CueService>> _mockLogger;
        private readonly CueService _service;

        public CueServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _mockRepository = new Mock<ICueRepository>();
            _mockLogger = new Mock<ILogger<CueService>>();
            _service = new CueService(_mockRepository.Object, _context, _mockLogger.Object);
        }

        [Fact]
        public async Task GetCueWithDetailsAsync_WithValidId_ReturnsCueWithDetails()
        {
            // Arrange
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                PasswordHash = "hash",
                Name = "Test User",
                Email = "test@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true
            };

            var cue = new Cue
            {
                Id = 1,
                Title = "Test Cue",
                Brand = "TestBrand",
                Description = "Test description",
                Price = 500.00m,
                Location = "Test Location",
                Condition = "Excellent",
                UserId = 1,
                User = user,
                IsSold = false,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Users.AddAsync(user);
            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetCueWithDetailsAsync(1);

            // Assert
            result.Should().NotBeNull();
            var cueResult = result!;
            cueResult.Title.Should().Be("Test Cue");
            cueResult.User.Should().NotBeNull();
            cueResult.User!.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task GetCueWithDetailsAsync_WithInvalidId_ReturnsNull()
        {
            // Act
            var result = await _service.GetCueWithDetailsAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetActiveCuesWithPaginationAsync_ReturnsActiveCues()
        {
            // Arrange
            var cues = new List<Cue>
            {
                CreateTestCue("Cue 1"),
                CreateTestCue("Cue 2")
            };

            _mockRepository
                .Setup(x => x.GetActiveCuesAsync(1, 20))
                .ReturnsAsync(cues);

            // Act
            var result = await _service.GetActiveCuesWithPaginationAsync(1, 20);

            // Assert
            result.Should().HaveCount(2);
        }

        [Fact]
        public async Task GetUserCuesAsync_ReturnsUsersCues()
        {
            // Arrange
            var cues = new List<Cue>
            {
                CreateTestCue("User Cue 1"),
                CreateTestCue("User Cue 2")
            };

            _mockRepository
                .Setup(x => x.GetCuesByUserAsync(1))
                .ReturnsAsync(cues);

            // Act
            var result = await _service.GetUserCuesAsync(1);

            // Assert
            result.Should().HaveCount(2);
            _mockRepository.Verify(x => x.GetCuesByUserAsync(1), Times.Once);
        }

        [Fact]
        public async Task SearchCuesAsync_WithQuery_ReturnsMatchingCues()
        {
            // Arrange
            var cues = new List<Cue>
            {
                CreateTestCue("Predator Cue")
            };

            _mockRepository
                .Setup(x => x.SearchCuesAsync("Predator", 1, 20))
                .ReturnsAsync(cues);

            // Act
            var result = await _service.SearchCuesAsync("Predator", 1, 20);

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Be("Predator Cue");
        }

        [Fact]
        public async Task CreateCueAsync_WithValidCue_ReturnsCreatedCue()
        {
            // Arrange
            var cue = CreateTestCue("New Cue");
            _mockRepository
                .Setup(x => x.AddAsync(It.IsAny<Cue>()))
                .ReturnsAsync((Cue c) => { c.Id = 1; return c; });

            // Act
            var result = await _service.CreateCueAsync(cue);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("New Cue");
            _mockRepository.Verify(x => x.AddAsync(It.IsAny<Cue>()), Times.Once);
        }

        [Fact]
        public async Task UpdateCueAsync_WithValidCue_ReturnsUpdatedCue()
        {
            // Arrange
            var cue = CreateTestCue("Updated Cue");
            cue.Id = 1;
            cue.Price = 999.99m;

            _mockRepository
                .Setup(x => x.UpdateAsync(It.IsAny<Cue>()))
                .ReturnsAsync(cue);

            // Act
            var result = await _service.UpdateCueAsync(cue);

            // Assert
            result.Should().NotBeNull();
            result.Price.Should().Be(999.99m);
            _mockRepository.Verify(x => x.UpdateAsync(It.IsAny<Cue>()), Times.Once);
        }

        [Fact]
        public async Task DeleteCueAsync_WithValidId_ReturnsTrue()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.DeleteAsync(1))
                .ReturnsAsync(true);

            // Act
            var result = await _service.DeleteCueAsync(1);

            // Assert
            result.Should().BeTrue();
            _mockRepository.Verify(x => x.DeleteAsync(1), Times.Once);
        }

        [Fact]
        public async Task DeleteCueAsync_WithInvalidId_ReturnsFalse()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.DeleteAsync(999))
                .ReturnsAsync(false);

            // Act
            var result = await _service.DeleteCueAsync(999);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task MarkAsSoldAsync_WithValidId_ReturnsTrue()
        {
            // Arrange
            var cue = CreateTestCue("Test Cue");
            cue.Id = 1;

            await _context.Cues.AddAsync(cue);
            await _context.SaveChangesAsync();

            // Setup mock to return the cue
            _mockRepository
                .Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(cue);
            
            _mockRepository
                .Setup(x => x.UpdateAsync(It.IsAny<Cue>()))
                .ReturnsAsync(cue);

            // Act
            var result = await _service.MarkAsSoldAsync(1);

            // Assert
            result.Should().BeTrue();
            _mockRepository.Verify(x => x.UpdateAsync(It.Is<Cue>(c => c.IsSold == true)), Times.Once);
        }

        [Fact]
        public async Task MarkAsSoldAsync_WithInvalidId_ReturnsFalse()
        {
            // Act
            var result = await _service.MarkAsSoldAsync(999);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetActiveCuesCountAsync_ReturnsCorrectCount()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.GetTotalActiveCuesCountAsync())
                .ReturnsAsync(10);

            // Act
            var result = await _service.GetActiveCuesCountAsync();

            // Assert
            result.Should().Be(10);
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
