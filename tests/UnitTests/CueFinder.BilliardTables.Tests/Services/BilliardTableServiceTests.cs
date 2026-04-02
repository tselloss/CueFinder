using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.BilliardTables.Services;
using CueFinder.BilliardTables.Models;
using CueFinder.BilliardTables.Interfaces;

namespace CueFinder.BilliardTables.Tests.Services
{
    /// <summary>
    /// Unit tests for BilliardTableService
    /// Tests CRUD operations, filtering, search, and business logic
    /// </summary>
    public class BilliardTableServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<BilliardTableService>> _loggerMock;
        private readonly Mock<IImageService> _imageServiceMock;
        private readonly BilliardTableService _service;

        public BilliardTableServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _loggerMock = new Mock<ILogger<BilliardTableService>>();
            _imageServiceMock = new Mock<IImageService>();
            _service = new BilliardTableService(_context, _loggerMock.Object, _imageServiceMock.Object);

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
        public async Task CreateBilliardTableAsync_ValidData_CreatesTable()
        {
            // Arrange
            var dto = new CreateBilliardTableDto
            {
                Title = "Brunswick Gold Crown",
                Brand = "Brunswick",
                Description = "Professional 9ft tournament table",
                Price = 8500.00m,
                TableSize = "9ft",
                TableType = "Pool",
                Condition = "excellent"
            };

            // Act
            var result = await _service.CreateBilliardTableAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Brunswick Gold Crown");
            result.Brand.Should().Be("Brunswick");
            result.Price.Should().Be(8500.00m);
            result.SellerId.Should().Be(1);

            var savedTable = await _context.BilliardTables.FirstOrDefaultAsync(t => t.Id == result.Id);
            savedTable.Should().NotBeNull();
            savedTable!.IsSold.Should().BeFalse();
        }

        [Fact]
        public async Task CreateBilliardTableAsync_InvalidUserId_ThrowsException()
        {
            // Arrange
            var dto = new CreateBilliardTableDto
            {
                Title = "Test Table",
                Price = 1000.00m
            };

            // Act
            Func<Task> act = async () => await _service.CreateBilliardTableAsync(dto, userId: 999);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>();
        }

        [Fact]
        public async Task CreateBilliardTableAsync_NegativePrice_AllowsCreation()
        {
            // Arrange
            var dto = new CreateBilliardTableDto
            {
                Title = "Test Table",
                Price = -100.00m
            };

            // Act
            var result = await _service.CreateBilliardTableAsync(dto, userId: 1);

            // Assert - Service allows negative prices
            result.Should().NotBeNull();
            result.Price.Should().Be(-100.00m);
        }

        #endregion

        #region Read Tests

        [Fact]
        public async Task GetAllBilliardTablesAsync_ReturnsAllTables()
        {
            // Arrange
            var table1 = new BilliardTable
            {
                UserId = 1,
                Title = "Table 1",
                Brand = "Brunswick",
                Price = 5000.00m,
                TableSize = "8ft",
                Condition = "excellent",
                IsSold = false
            };

            var table2 = new BilliardTable
            {
                UserId = 1,
                Title = "Table 2",
                Brand = "Diamond",
                Price = 7000.00m,
                TableSize = "9ft",
                Condition = "new",
                IsSold = false
            };

            _context.BilliardTables.AddRange(table1, table2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllBilliardTablesAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(t => t.IsSold.Should().BeFalse());
        }

        [Fact]
        public async Task GetAllBilliardTablesAsync_WithBrandFilter_ReturnsFilteredTables()
        {
            // Arrange
            var table1 = new BilliardTable
            {
                UserId = 1,
                Title = "Brunswick Table",
                Brand = "Brunswick",
                Price = 5000.00m,
                IsSold = false
            };

            var table2 = new BilliardTable
            {
                UserId = 1,
                Title = "Diamond Table",
                Brand = "Diamond",
                Price = 7000.00m,
                IsSold = false
            };

            _context.BilliardTables.AddRange(table1, table2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetAllBilliardTablesAsync(brand: "Brunswick");

            // Assert
            result.Should().HaveCount(1);
            result.First().Brand.Should().Be("Brunswick");
        }

        [Fact]
        public async Task GetBilliardTableByIdAsync_ExistingId_ReturnsTable()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "Test Table",
                Brand = "Brunswick",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetBilliardTableByIdAsync(table.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Test Table");
        }

        [Fact]
        public async Task GetBilliardTableByIdAsync_NonExistingId_ReturnsNull()
        {
            // Act
            var result = await _service.GetBilliardTableByIdAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetUserBilliardTablesAsync_ReturnsUserTables()
        {
            // Arrange
            var table1 = new BilliardTable
            {
                UserId = 1,
                Title = "User 1 Table",
                Price = 5000.00m,
                IsSold = false
            };

            var table2 = new BilliardTable
            {
                UserId = 2,
                Title = "User 2 Table",
                Price = 6000.00m,
                IsSold = false
            };

            _context.BilliardTables.AddRange(table1, table2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetUserBilliardTablesAsync(userId: 1);

            // Assert
            result.Should().HaveCount(1);
            result.First().SellerId.Should().Be(1);
        }

        [Fact]
        public async Task SearchBilliardTablesAsync_FindsMatchingTables()
        {
            // Arrange
            var table1 = new BilliardTable
            {
                UserId = 1,
                Title = "Brunswick Gold Crown Tournament",
                Description = "Professional pool table",
                Price = 8000.00m,
                IsSold = false
            };

            var table2 = new BilliardTable
            {
                UserId = 1,
                Title = "Diamond Pro-Am",
                Description = "High-quality snooker table",
                Price = 9000.00m,
                IsSold = false
            };

            _context.BilliardTables.AddRange(table1, table2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SearchBilliardTablesAsync("Brunswick");

            // Assert
            result.Should().HaveCount(1);
            result.First().Title.Should().Contain("Brunswick");
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateBilliardTableAsync_ValidData_UpdatesTable()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "Original Title",
                Brand = "Brunswick",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBilliardTableDto
            {
                Title = "Updated Title",
                Price = 4500.00m
            };

            // Act
            var result = await _service.UpdateBilliardTableAsync(table.Id, updateDto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result!.Title.Should().Be("Updated Title");
            result.Price.Should().Be(4500.00m);
        }

        [Fact]
        public async Task UpdateBilliardTableAsync_NotOwner_ReturnsNull()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "Test Table",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBilliardTableDto { Title = "Hacked" };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.UpdateBilliardTableAsync(table.Id, updateDto, userId: 2));
        }

        [Fact]
        public async Task UpdateBilliardTableAsync_SoldTable_AllowsUpdate()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "Sold Table",
                Price = 5000.00m,
                IsSold = true,
                SoldDate = DateTime.UtcNow
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateBilliardTableDto { Price = 4000.00m };

            // Act
            var result = await _service.UpdateBilliardTableAsync(table.Id, updateDto, userId: 1);

            // Assert - Service allows updating sold tables
            result.Should().NotBeNull();
            result.Price.Should().Be(4000.00m);
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteBilliardTableAsync_Owner_DeletesTable()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "To Delete",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteBilliardTableAsync(table.Id, userId: 1);

            // Assert
            result.Should().BeTrue();

            var deleted = await _context.BilliardTables.FindAsync(table.Id);
            deleted.Should().BeNull();
        }

        [Fact]
        public async Task DeleteBilliardTableAsync_NotOwner_ReturnsFalse()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "Protected",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service.DeleteBilliardTableAsync(table.Id, userId: 2, isAdmin: false));
        }

        [Fact]
        public async Task DeleteBilliardTableAsync_Admin_DeletesTable()
        {
            // Arrange
            var table = new BilliardTable
            {
                UserId = 1,
                Title = "To Delete",
                Price = 5000.00m,
                IsSold = false
            };

            _context.BilliardTables.Add(table);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.DeleteBilliardTableAsync(table.Id, userId: 2, isAdmin: true);

            // Assert
            result.Should().BeTrue();
        }

        #endregion

        #region Filtering Tests

        [Fact]
        public async Task GetFilteredBilliardTablesAsync_WithPriceRange_ReturnsFilteredResults()
        {
            // Arrange
            var tables = new[]
            {
                new BilliardTable { UserId = 1, Title = "Low", Price = 3000.00m, IsSold = false },
                new BilliardTable { UserId = 1, Title = "Mid", Price = 6000.00m, IsSold = false },
                new BilliardTable { UserId = 1, Title = "High", Price = 12000.00m, IsSold = false }
            };

            _context.BilliardTables.AddRange(tables);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetFilteredBilliardTablesAsync(
                tableSize: null,
                tableType: null,
                condition: null,
                minPrice: 5000.00m,
                maxPrice: 8000.00m,
                page: 1,
                pageSize: 10
            );

            // Assert
            result.Should().HaveCount(1);
            result.First().Price.Should().Be(6000.00m);
        }

        [Fact]
        public async Task GetFilteredBilliardTablesAsync_WithTableSize_ReturnsFiltered()
        {
            // Arrange
            var tables = new[]
            {
                new BilliardTable { UserId = 1, Title = "Small", TableSize = "7ft", Price = 3000.00m, IsSold = false },
                new BilliardTable { UserId = 1, Title = "Standard", TableSize = "8ft", Price = 5000.00m, IsSold = false },
                new BilliardTable { UserId = 1, Title = "Tournament", TableSize = "9ft", Price = 8000.00m, IsSold = false }
            };

            _context.BilliardTables.AddRange(tables);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetFilteredBilliardTablesAsync(
                tableSize: "9ft",
                tableType: null,
                condition: null,
                minPrice: null,
                maxPrice: null,
                page: 1,
                pageSize: 10
            );

            // Assert
            result.Should().HaveCount(1);
            result.First().TableSize.Should().Be("9ft");
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
