using CueFinder.CueCases.Services;
using CueFinder.CueCases.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using CueFinder.CueCases.Interfaces;

namespace CueFinder.CueCases.Tests.Services
{
    public class CueCaseServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<CueCaseService>> _logger = new();
        private readonly Mock<IImageService> _imageService = new();
        private readonly CueCaseService _service;

        public CueCaseServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new CueFinderDbContext(options);
            _service = new CueCaseService(_context, _logger.Object, _imageService.Object);
        }

        [Fact]
        public async Task CreateCueCaseAsync_WithValidUser_CreatesCase()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var dto = new CreateCueCaseDto
            {
                Title = "Case1",
                Brand = "Brand1",
                Description = "Desc",
                Price = 50,
                Condition = "New",
                CaseCapacity = "2x4",
                CaseOpening = "Top",
                CaseType = "Hard",
                Location = "LA"
            };

            var created = await _service.CreateCueCaseAsync(dto, user.Id);
            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            created.SellerId.Should().Be(user.Id);
        }

        [Fact]
        public async Task GetCueCaseByIdAsync_IncrementsViewCount()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cc = new CueCase { Title = "T", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.CueCases.Add(cc);
            await _context.SaveChangesAsync();

            var before = (await _context.CueCases.FindAsync(cc.Id))!.ViewCount;
            var dto = await _service.GetCueCaseByIdAsync(cc.Id);
            dto.Should().NotBeNull();
            var after = (await _context.CueCases.FindAsync(cc.Id))!.ViewCount;
            after.Should().Be(before + 1);
        }

        [Fact]
        public async Task UpdateCueCaseAsync_WithOwner_Updates()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cc = new CueCase { Title = "Old", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.CueCases.Add(cc);
            await _context.SaveChangesAsync();

            var updated = await _service.UpdateCueCaseAsync(cc.Id, new UpdateCueCaseDto { Title = "New", Price = 20 }, user.Id);
            updated.Should().NotBeNull();
            updated!.Title.Should().Be("New");
            updated.Price.Should().Be(20);
        }

        [Fact]
        public async Task UpdateCueCaseAsync_WithWrongUser_ThrowsUnauthorized()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cc = new CueCase { Title = "Old", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.CueCases.Add(cc);
            await _context.SaveChangesAsync();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.UpdateCueCaseAsync(cc.Id, new UpdateCueCaseDto { Title = "X" }, 999));
        }

        [Fact]
        public async Task DeleteCueCaseAsync_WithOwner_Deletes()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cc = new CueCase { Title = "T", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.CueCases.Add(cc);
            await _context.SaveChangesAsync();

            var ok = await _service.DeleteCueCaseAsync(cc.Id, user.Id);
            ok.Should().BeTrue();
            (await _context.CueCases.FindAsync(cc.Id)).Should().BeNull();
        }

        [Fact]
        public async Task GetAllCueCasesAsync_FilterAndSort_Works()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            _context.CueCases.AddRange(new[]
            {
                new CueCase { Title = "A", Brand = "Longoni", Description = "", Price = 100, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new CueCase { Title = "B", Brand = "Predator", Description = "", Price = 200, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();

            var list = await _service.GetAllCueCasesAsync(brand: "Predator", sortBy: "price_desc");
            list.Should().HaveCount(1);
            list[0].Brand.Should().Be("Predator");
        }

        [Fact]
        public async Task SearchCueCasesAsync_FindsByBrandOrTitle()
        {
            var user = new User { Username = "u", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            _context.CueCases.AddRange(new[]
            {
                new CueCase { Title = "JB Rugged", Brand = "JB", Description = "", Price = 100, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new CueCase { Title = "Other", Brand = "Unknown", Description = "", Price = 200, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();

            var results = await _service.SearchCueCasesAsync("JB");
            results.Should().HaveCount(1);
            results[0].Brand.Should().Be("JB");
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
