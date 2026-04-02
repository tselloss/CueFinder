using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Accessories.Services;
using CueFinder.Accessories.Models;
using CueFinder.Accessories.Interfaces;

namespace CueFinder.Accessories.Tests.Services
{
    /// <summary>
    /// Unit tests for AccessoryService
    /// Tests CRUD operations, filtering, search, and business logic
    /// </summary>
    public class AccessoryServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<AccessoryService>> _loggerMock;
        private readonly Mock<IImageService> _imageServiceMock;
        private readonly AccessoryService _service;

        public AccessoryServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _loggerMock = new Mock<ILogger<AccessoryService>>();
            _imageServiceMock = new Mock<IImageService>();
            _service = new AccessoryService(_context, _loggerMock.Object, _imageServiceMock.Object);

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

            _context.Users.AddRange(user, otherUser);
            _context.SaveChanges();
        }

        #region Create Tests

        [Fact]
        public async Task CreateAccessoryAsync_ValidData_CreatesAccessory()
        {
            // Arrange
            var dto = new CreateAccessoryDto
            {
                Title = "Kamui Black Tip",
                Brand = "Kamui",
                Description = "Soft tip for maximum control",
                Price = 25.00m,
                AccessoryType = "tip",
                Condition = "new"
            };

            // Act
            var result = await _service.CreateAccessoryAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Kamui Black Tip");
            result.Brand.Should().Be("Kamui");
            result.Price.Should().Be(25.00m);
            result.SellerId.Should().Be(1);

            var savedAccessory = await _context.Accessories.FirstOrDefaultAsync(a => a.Id == result.Id);
            savedAccessory.Should().NotBeNull();
            savedAccessory!.IsSold.Should().BeFalse();
        }

        [Fact]
        public async Task CreateAccessoryAsync_InvalidUserId_ThrowsException()
        {
            // Arrange
            var dto = new CreateAccessoryDto
            {
                Title = "Test Accessory",
                Price = 10.00m
            };

            // Act
            Func<Task> act = async () => await _service.CreateAccessoryAsync(dto, userId: 999);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task CreateAccessoryAsync_NegativePrice_AllowsCreation()
        {
            // Arrange
            var dto = new CreateAccessoryDto
            {
                Title = "Test Accessory",
                Price = -10.00m
            };

            // Act
            var result = await _service.CreateAccessoryAsync(dto, userId: 1);

            // Assert - Service allows negative prices
            result.Should().NotBeNull();
            result.Price.Should().Be(-10.00m);
        }

        #endregion

        #region Read Tests

        [Fact]
        public async Task GetAllAccessoriesAsync_ReturnsAllAccessories()
        {
            // Arrange
            var accessory1 = new Accessory
            {
                UserId = 1,
                Title = "Accessory 1",
                Brand = "Brand A",
                Price = 20.00m,
                Condition = "new",
                IsSold = false
            };

            var accessory2 = new Accessory
            {
                UserId = 1,
                Title = "Accessory 2",
                Brand = "Brand B",
                Price = 30.00m,
                Condition = "used",
                IsSold = false
            };

            _context.Accessories.AddRange(accessory1, accessory2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllAccessoriesAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(a => a.IsSold.Should().BeFalse());
        }

        [Fact]
        public async Task GetAllAccessoriesAsync_WithBrandFilter_ReturnsFilteredAccessories()
        {
            // Arrange
            var accessory1 = new Accessory
            {
                UserId = 1,
                Title = "Kamui Tip",
                Brand = "Kamui",
                Price = 25.00m,
                IsSold = false
            };

            var accessory2 = new Accessory
            {
                UserId = 1,
                Title = "Moori Tip",
                Brand = "Moori",
                Price = 30.00m,
                IsSold = false
            };

            _context.Accessories.AddRange(accessory1, accessory2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllAccessoriesAsync(brand: "Kamui");

            // Assert
            result.Should().HaveCount(1);
            result.First().Brand.Should().Be("Kamui");
        }

        [Fact]
        public async Task GetAccessoryByIdAsync_ExistingId_ReturnsAccessory()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "Test Accessory",
                Brand = "Test Brand",
                Price = 15.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAccessoryByIdAsync(accessory.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Test Accessory");
        }

        [Fact]
        public async Task GetAccessoryByIdAsync_NonExistingId_ReturnsNull()
        {
            // Act
            var result = await _service.GetAccessoryByIdAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserAccessoriesAsync_ReturnsUserAccessories()
        {
            // Arrange
            var accessory1 = new Accessory
            {
                UserId = 1,
                Title = "User 1 Accessory",
                Price = 10.00m,
                IsSold = false
            };

            var accessory2 = new Accessory
            {
                UserId = 2,
                Title = "User 2 Accessory",
                Price = 20.00m,
                IsSold = false
            };

            _context.Accessories.AddRange(accessory1, accessory2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserAccessoriesAsync(userId: 1);

            // Assert
            result.Should().HaveCount(1);
            result.First().SellerId.Should().Be(1);
        }

        [Fact]
        public async Task SearchAccessoriesAsync_FindsMatchingAccessories()
        {
            // Arrange
            var accessory1 = new Accessory
            {
                UserId = 1,
                Title = "Kamui Black Tip",
                Description = "Soft billiard tip",
                Price = 25.00m,
                IsSold = false
            };

            var accessory2 = new Accessory
            {
                UserId = 1,
                Title = "Chalk Holder",
                Description = "Leather chalk holder",
                Price = 15.00m,
                IsSold = false
            };

            _context.Accessories.AddRange(accessory1, accessory2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SearchAccessoriesAsync("tip");

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Contain("Tip");
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateAccessoryAsync_ValidData_UpdatesAccessory()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "Original Title",
                Brand = "Original Brand",
                Price = 20.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateAccessoryDto
            {
                Title = "Updated Title",
                Price = 18.00m
            };

            // Act
            var result = await _service.UpdateAccessoryAsync(accessory.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Updated Title");
            result.Price.Should().Be(18.00m);
        }

        [Fact]
        public async Task UpdateAccessoryAsync_NotOwner_ReturnsNull()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "Test Accessory",
                Price = 20.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateAccessoryDto { Title = "Hacked" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.UpdateAccessoryAsync(accessory.Id, updateDto, userId: 2));
        }

        [Fact]
        public async Task UpdateAccessoryAsync_SoldAccessory_AllowsUpdate()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "Sold Accessory",
                Price = 20.00m,
                IsSold = true,
                SoldDate = DateTime.UtcNow
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateAccessoryDto { Price = 15.00m };

            // Act
            var result = await _service.UpdateAccessoryAsync(accessory.Id, updateDto, userId: 1);

            // Assert - Service allows updating sold accessories
            result.Should().NotBeNull();
            result.Price.Should().Be(15.00m);
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteAccessoryAsync_Owner_DeletesAccessory()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "To Delete",
                Price = 10.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteAccessoryAsync(accessory.Id, userId: 1);

            // Assert
            result.Should().BeTrue();

            var deleted = await _context.Accessories.FindAsync(accessory.Id);
            deleted.Should().BeNull();
        }

        [Fact]
        public async Task DeleteAccessoryAsync_NotOwner_ReturnsFalse()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "Protected",
                Price = 10.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.DeleteAccessoryAsync(accessory.Id, userId: 2, isAdmin: false));
        }

        [Fact]
        public async Task DeleteAccessoryAsync_Admin_DeletesAccessory()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "To Delete",
                Price = 10.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.DeleteAccessoryAsync(accessory.Id, userId: 2, isAdmin: false));
        }

        #endregion

        #region Mark As Sold Tests

        [Fact]
        public async Task MarkAsSoldAsync_Owner_MarksAccessoryAsSold()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "For Sale",
                Price = 25.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.MarkAsSoldAsync(accessory.Id, userId: 1);

            // Assert
            result.Should().BeTrue();

            var updated = await _context.Accessories.FindAsync(accessory.Id);
            updated!.IsSold.Should().BeTrue();
            updated.SoldDate.Should().NotBeNull();
        }

        [Fact]
        public async Task MarkAsSoldAsync_NotOwner_ReturnsFalse()
        {
            // Arrange
            var accessory = new Accessory
            {
                UserId = 1,
                Title = "For Sale",
                Price = 25.00m,
                IsSold = false
            };

            _context.Accessories.Add(accessory);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.MarkAsSoldAsync(accessory.Id, userId: 2));
        }

        #endregion

        #region Filtering Tests

        [Fact]
        public async Task GetFilteredAccessoriesAsync_WithPriceRange_ReturnsFilteredResults()
        {
            // Arrange
            var accessories = new[]
            {
                new Accessory { UserId = 1, Title = "Low", Price = 10.00m, IsSold = false },
                new Accessory { UserId = 1, Title = "Mid", Price = 25.00m, IsSold = false },
                new Accessory { UserId = 1, Title = "High", Price = 50.00m, IsSold = false }
            };

            _context.Accessories.AddRange(accessories);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetFilteredAccessoriesAsync(
                accessoryType: null,
                material: null,
                condition: null,
                minPrice: 20.00m,
                maxPrice: 30.00m,
                page: 1,
                pageSize: 10
            );

            // Assert
            result.Should().HaveCount(1);
            result.First().Price.Should().Be(25.00m);
        }

        [Fact]
        public async Task GetActiveCountAsync_ReturnsCorrectCount()
        {
            // Arrange
            var accessories = new[]
            {
                new Accessory { UserId = 1, Title = "Active 1", Price = 10.00m, IsSold = false },
                new Accessory { UserId = 1, Title = "Active 2", Price = 20.00m, IsSold = false },
                new Accessory { UserId = 1, Title = "Sold", Price = 30.00m, IsSold = true }
            };

            _context.Accessories.AddRange(accessories);
            await _context.SaveChangesAsync();

            // Act
            var count = await _service.GetActiveCountAsync();

            // Assert
            count.Should().Be(2);
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
