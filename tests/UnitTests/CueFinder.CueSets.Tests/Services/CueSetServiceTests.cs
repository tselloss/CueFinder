using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.CueSets.Services;
using CueFinder.CueSets.Models;
using CueFinder.CueSets.Interfaces;

namespace CueFinder.CueSets.Tests.Services
{
    /// <summary>
    /// Unit tests for CueSetService
    /// Tests CRUD operations, filtering, search, and business logic
    /// </summary>
    public class CueSetServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<CueSetService>> _loggerMock;
        private readonly Mock<IImageService> _imageServiceMock;
        private readonly CueSetService _service;

        public CueSetServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _loggerMock = new Mock<ILogger<CueSetService>>();
            _imageServiceMock = new Mock<IImageService>();
            _service = new CueSetService(_context, _loggerMock.Object, _imageServiceMock.Object);

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                Name = "Test User",
                PasswordHash = "hash",
                IsActive = true
            };

            var otherUser = new User
            {
                Id = 2,
                Username = "otheruser",
                Email = "other@example.com",
                Name = "Other User",
                PasswordHash = "hash",
                IsActive = true
            };

            var adminUser = new User
            {
                Id = 3,
                Username = "admin",
                Email = "admin@example.com",
                Name = "Admin User",
                PasswordHash = "hash",
                IsActive = true,
                Role = "admin"
            };

            _context.Users.AddRange(user, otherUser, adminUser);
            _context.SaveChanges();
        }

        #region Create Tests

        [Fact]
        public async Task CreateCueSetAsync_ValidData_CreatesSet()
        {
            // Arrange
            var dto = new CreateCueSetDto
            {
                Title = "Predator BK Rush Complete Set",
                Brand = "Predator",
                Description = "Complete set with playing cue and break cue",
                Price = 1500.00m,
                Condition = "new",
                IncludesPlayingCue = true,
                IncludesBreakCue = true,
                IncludesCase = true,
                PlayingCueWeight = 19.0m,
                BreakCueWeight = 20.0m
            };

            // Act
            var result = await _service.CreateCueSetAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Predator BK Rush Complete Set");
            result.Brand.Should().Be("Predator");
            result.Price.Should().Be(1500.00m);
            result.IncludesPlayingCue.Should().BeTrue();
            result.IncludesBreakCue.Should().BeTrue();
            result.IncludesCase.Should().BeTrue();
            result.UserId.Should().Be(1);

            var savedSet = await _context.CueSets.FirstOrDefaultAsync(s => s.Id == result.Id);
            savedSet.Should().NotBeNull();
            savedSet!.IsSold.Should().BeFalse();
        }

        [Fact]
        public async Task CreateCueSetAsync_InvalidUserId_ThrowsException()
        {
            // Arrange
            var dto = new CreateCueSetDto
            {
                Title = "Test Set",
                Price = 500.00m,
                IncludesPlayingCue = true
            };

            // Act
            Func<Task> act = async () => await _service.CreateCueSetAsync(dto, userId: 999);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*User not found*");
        }

        [Fact]
        public async Task CreateCueSetAsync_WithAllCueTypes_CreatesSuccessfully()
        {
            // Arrange
            var dto = new CreateCueSetDto
            {
                Title = "Ultimate Complete Set",
                Brand = "Predator",
                Price = 2500.00m,
                Condition = "new",
                IncludesPlayingCue = true,
                IncludesBreakCue = true,
                IncludesJumpCue = true,
                IncludesCase = true,
                PlayingCueWeight = 19.0m,
                BreakCueWeight = 20.0m,
                JumpCueWeight = 10.5m
            };

            // Act
            var result = await _service.CreateCueSetAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.IncludesPlayingCue.Should().BeTrue();
            result.IncludesBreakCue.Should().BeTrue();
            result.IncludesJumpCue.Should().BeTrue();
            result.IncludesCase.Should().BeTrue();
        }

        [Fact]
        public async Task CreateCueSetAsync_WithCaseOnly_CreatesSuccessfully()
        {
            // Arrange
            var dto = new CreateCueSetDto
            {
                Title = "Predator Hard Case",
                Brand = "Predator",
                Description = "Hard case for 2x2 cues",
                Price = 200.00m,
                Condition = "new",
                IncludesCase = true,
                CaseCapacity = "2x2",
                CaseType = "hard"
            };

            // Act
            var result = await _service.CreateCueSetAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.IncludesCase.Should().BeTrue();
            result.IncludesPlayingCue.Should().BeFalse();
            result.IncludesBreakCue.Should().BeFalse();
            result.IncludesJumpCue.Should().BeFalse();
        }

        #endregion

        #region Read Tests

        [Fact]
        public async Task GetAllCueSetsAsync_ReturnsAllActiveSets()
        {
            // Arrange
            var set1 = new CueSet
            {
                UserId = 1,
                Title = "Set 1",
                Brand = "Predator",
                Price = 1000.00m,
                Condition = "new",
                IncludesPlayingCue = true,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var set2 = new CueSet
            {
                UserId = 1,
                Title = "Set 2",
                Brand = "McDermott",
                Price = 1500.00m,
                Condition = "excellent",
                IncludesPlayingCue = true,
                IncludesBreakCue = true,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var soldSet = new CueSet
            {
                UserId = 1,
                Title = "Sold Set",
                Price = 800.00m,
                IsSold = true,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.AddRange(set1, set2, soldSet);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllCueSetsAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(s => s.IsSold.Should().BeFalse());
        }

        [Fact]
        public async Task GetAllCueSetsAsync_WithBrandFilter_ReturnsFilteredSets()
        {
            // Arrange
            var set1 = new CueSet
            {
                UserId = 1,
                Title = "Predator Set",
                Brand = "Predator",
                Price = 1000.00m,
                IncludesPlayingCue = true,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var set2 = new CueSet
            {
                UserId = 1,
                Title = "McDermott Set",
                Brand = "McDermott",
                Price = 1200.00m,
                IncludesPlayingCue = true,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.AddRange(set1, set2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllCueSetsAsync(brand: "Predator");

            // Assert
            result.Should().HaveCount(1);
            result.First().Brand.Should().Be("Predator");
        }

        [Fact]
        public async Task GetAllCueSetsAsync_WithPriceFilter_ReturnsFilteredSets()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet { UserId = 1, Title = "Low", Price = 500.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new CueSet { UserId = 1, Title = "Mid", Price = 1200.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new CueSet { UserId = 1, Title = "High", Price = 2500.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllCueSetsAsync(minPrice: 1000.00m, maxPrice: 1500.00m);

            // Assert
            result.Should().HaveCount(1);
            result.First().Price.Should().Be(1200.00m);
        }

        [Fact]
        public async Task GetAllCueSetsAsync_WithConditionFilter_ReturnsFilteredSets()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet { UserId = 1, Title = "New Set", Condition = "new", Price = 1000.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new CueSet { UserId = 1, Title = "Used Set", Condition = "used", Price = 800.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllCueSetsAsync(condition: "new");

            // Assert
            result.Should().HaveCount(1);
            result.First().Condition.Should().Be("new");
        }

        [Fact]
        public async Task GetAllCueSetsAsync_WithSortByPriceAsc_ReturnsSortedSets()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet { UserId = 1, Title = "High", Price = 2000.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new CueSet { UserId = 1, Title = "Low", Price = 500.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
                new CueSet { UserId = 1, Title = "Mid", Price = 1000.00m, IsSold = false, IsHidden = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllCueSetsAsync(sortBy: "price_asc");

            // Assert
            result.Should().HaveCount(3);
            result[0].Price.Should().Be(500.00m);
            result[1].Price.Should().Be(1000.00m);
            result[2].Price.Should().Be(2000.00m);
        }

        [Fact]
        public async Task GetCueSetByIdAsync_ExistingId_ReturnsSet()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Test Set",
                Brand = "Predator",
                Price = 1000.00m,
                IncludesPlayingCue = true,
                IsSold = false,
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetCueSetByIdAsync(set.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Test Set");
            
            // ViewCount should increment
            var updatedSet = await _context.CueSets.FindAsync(set.Id);
            updatedSet!.ViewCount.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task GetCueSetByIdAsync_NonExistingId_ReturnsNull()
        {
            // Act
            var result = await _service.GetCueSetByIdAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserCueSetsAsync_ReturnsUserSets()
        {
            // Arrange
            var set1 = new CueSet
            {
                UserId = 1,
                Title = "User 1 Set 1",
                Price = 1000.00m,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var set2 = new CueSet
            {
                UserId = 1,
                Title = "User 1 Set 2",
                Price = 1200.00m,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var set3 = new CueSet
            {
                UserId = 2,
                Title = "User 2 Set",
                Price = 1500.00m,
                IsSold = false,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.AddRange(set1, set2, set3);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserCueSetsAsync(userId: 1);

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(s => s.UserId.Should().Be(1));
        }

        [Fact]
        public async Task GetUserCueSetsAsync_WithHiddenFilter_ReturnsFilteredSets()
        {
            // Arrange
            var activeSet = new CueSet
            {
                UserId = 1,
                Title = "Active Set",
                Price = 1000.00m,
                IsHidden = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var hiddenSet = new CueSet
            {
                UserId = 1,
                Title = "Hidden Set",
                Price = 1200.00m,
                IsHidden = true,
                HiddenAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.AddRange(activeSet, hiddenSet);
            await _context.SaveChangesAsync();

            // Act
            var visibleSets = await _service.GetUserCueSetsAsync(userId: 1, hidden: false);
            var hiddenSets = await _service.GetUserCueSetsAsync(userId: 1, hidden: true);

            // Assert
            visibleSets.Should().HaveCount(1);
            visibleSets.First().IsHidden.Should().BeFalse();
            
            hiddenSets.Should().HaveCount(1);
            hiddenSets.First().IsHidden.Should().BeTrue();
        }

        [Fact]
        public async Task SearchCueSetsAsync_FindsMatchingSetsByTitle()
        {
            // Arrange
            var set1 = new CueSet
            {
                UserId = 1,
                Title = "Predator BK Rush Complete",
                Description = "Professional cue set",
                Price = 1500.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var set2 = new CueSet
            {
                UserId = 1,
                Title = "McDermott Classic Set",
                Description = "Elegant cue collection",
                Price = 1800.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.AddRange(set1, set2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SearchCueSetsAsync("Predator");

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Contain("Predator");
        }

        [Fact]
        public async Task SearchCueSetsAsync_FindsMatchingSetsByDescription()
        {
            // Arrange
            var set1 = new CueSet
            {
                UserId = 1,
                Title = "Professional Set",
                Description = "Predator BK Rush cues",
                Price = 1500.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set1);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SearchCueSetsAsync("Predator");

            // Assert
            result.Should().HaveCount(1);
        }

        [Fact]
        public async Task SearchCueSetsAsync_DoesNotReturnSoldItems()
        {
            // Arrange
            var soldSet = new CueSet
            {
                UserId = 1,
                Title = "Predator Set - SOLD",
                IsSold = true,
                SoldDate = DateTime.UtcNow,
                Price = 1000.00m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(soldSet);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SearchCueSetsAsync("Predator");

            // Assert
            result.Should().BeEmpty();
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateCueSetAsync_ValidData_UpdatesSet()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Original Title",
                Brand = "Predator",
                Price = 1000.00m,
                IncludesPlayingCue = true,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateCueSetDto
            {
                Title = "Updated Title",
                Price = 900.00m
            };

            // Act
            var result = await _service.UpdateCueSetAsync(set.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Updated Title");
            result.Price.Should().Be(900.00m);
        }

        [Fact]
        public async Task UpdateCueSetAsync_NotOwner_ThrowsUnauthorizedException()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Test Set",
                Price = 1000.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateCueSetDto { Title = "Hacked" };

            // Act
            Func<Task> act = async () => await _service.UpdateCueSetAsync(set.Id, updateDto, userId: 2);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("*only update your own*");
        }

        [Fact]
        public async Task UpdateCueSetAsync_NonExistingSet_ReturnsNull()
        {
            // Arrange
            var updateDto = new UpdateCueSetDto { Title = "Updated" };

            // Act
            var result = await _service.UpdateCueSetAsync(999, updateDto, userId: 1);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateCueSetAsync_UpdatesIncludesProperties()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Test Set",
                Price = 1000.00m,
                IncludesPlayingCue = true,
                IncludesBreakCue = false,
                IncludesCase = false,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateCueSetDto
            {
                IncludesBreakCue = true,
                IncludesCase = true,
                BreakCueWeight = 20.0m
            };

            // Act
            var result = await _service.UpdateCueSetAsync(set.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.IncludesPlayingCue.Should().BeTrue();
            result.IncludesBreakCue.Should().BeTrue();
            result.IncludesCase.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateCueSetAsync_MarkAsSold_UpdatesSoldStatus()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "For Sale",
                Price = 1000.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateCueSetDto
            {
                IsSold = true
            };

            // Act
            var result = await _service.UpdateCueSetAsync(set.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.IsSold.Should().BeTrue();
            result.SoldDate.Should().NotBeNull();
        }

        [Fact]
        public async Task UpdateCueSetAsync_HideSet_UpdatesHiddenStatus()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Active Set",
                Price = 1000.00m,
                IsHidden = false,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateCueSetDto
            {
                IsHidden = true
            };

            // Act
            var result = await _service.UpdateCueSetAsync(set.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.IsHidden.Should().BeTrue();
            result.HiddenAt.Should().NotBeNull();
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteCueSetAsync_Owner_DeletesSet()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "To Delete",
                Price = 1000.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            // Mock image deletion
            _imageServiceMock
                .Setup(x => x.DeleteCueSetImagesInternalAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeleteCueSetAsync(set.Id, userId: 1);

            // Assert
            result.Should().BeTrue();

            var deleted = await _context.CueSets.FindAsync(set.Id);
            deleted.Should().BeNull();

            _imageServiceMock.Verify(x => x.DeleteCueSetImagesInternalAsync(set.Id), Times.Once);
        }

        [Fact]
        public async Task DeleteCueSetAsync_NotOwner_ThrowsUnauthorizedException()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "Protected",
                Price = 1000.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            // Act
            Func<Task> act = async () => await _service.DeleteCueSetAsync(set.Id, userId: 2, isAdmin: false);

            // Assert
            await act.Should().ThrowAsync<UnauthorizedAccessException>()
                .WithMessage("*only delete your own*");

            var stillExists = await _context.CueSets.FindAsync(set.Id);
            stillExists.Should().NotBeNull();
        }

        [Fact]
        public async Task DeleteCueSetAsync_Admin_DeletesSet()
        {
            // Arrange
            var set = new CueSet
            {
                UserId = 1,
                Title = "To Delete",
                Price = 1000.00m,
                IsSold = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.CueSets.Add(set);
            await _context.SaveChangesAsync();

            _imageServiceMock
                .Setup(x => x.DeleteCueSetImagesInternalAsync(It.IsAny<int>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.DeleteCueSetAsync(set.Id, userId: 3, isAdmin: true);

            // Assert
            result.Should().BeTrue();

            var deleted = await _context.CueSets.FindAsync(set.Id);
            deleted.Should().BeNull();
        }

        [Fact]
        public async Task DeleteCueSetAsync_NonExistingSet_ReturnsFalse()
        {
            // Act
            var result = await _service.DeleteCueSetAsync(999, userId: 1);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region Filtering Tests by What's Included

        [Fact]
        public async Task FilterByIncludesCase_ReturnsOnlySetsWithCase()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Set with Case", 
                    Price = 1000.00m, 
                    IncludesCase = true, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Set without Case", 
                    Price = 800.00m, 
                    IncludesCase = false, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act - Manual filtering since GetAllCueSetsAsync doesn't have this parameter
            var allSets = await _service.GetAllCueSetsAsync();
            var filtered = allSets.Where(s => s.IncludesCase).ToList();

            // Assert
            filtered.Should().HaveCount(1);
            filtered.First().IncludesCase.Should().BeTrue();
        }

        [Fact]
        public async Task FilterByIncludesBreakCue_ReturnsOnlySetsWithBreakCue()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Set with Break Cue", 
                    Price = 1500.00m, 
                    IncludesPlayingCue = true,
                    IncludesBreakCue = true, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Playing Cue Only", 
                    Price = 800.00m, 
                    IncludesPlayingCue = true,
                    IncludesBreakCue = false, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act
            var allSets = await _service.GetAllCueSetsAsync();
            var filtered = allSets.Where(s => s.IncludesBreakCue).ToList();

            // Assert
            filtered.Should().HaveCount(1);
            filtered.First().IncludesBreakCue.Should().BeTrue();
        }

        [Fact]
        public async Task FilterByIncludesJumpCue_ReturnsOnlySetsWithJumpCue()
        {
            // Arrange
            var sets = new[]
            {
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Complete Set with Jump", 
                    Price = 2000.00m, 
                    IncludesPlayingCue = true,
                    IncludesBreakCue = true,
                    IncludesJumpCue = true, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                },
                new CueSet 
                { 
                    UserId = 1, 
                    Title = "Basic Set", 
                    Price = 1000.00m, 
                    IncludesPlayingCue = true,
                    IncludesJumpCue = false, 
                    IsSold = false, 
                    IsHidden = false,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            };

            _context.CueSets.AddRange(sets);
            await _context.SaveChangesAsync();

            // Act
            var allSets = await _service.GetAllCueSetsAsync();
            var filtered = allSets.Where(s => s.IncludesJumpCue).ToList();

            // Assert
            filtered.Should().HaveCount(1);
            filtered.First().IncludesJumpCue.Should().BeTrue();
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
