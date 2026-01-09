using CueFinder.Cues.Services;
using CueFinder.Cues.Models;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Cues.Tests.Services
{
    public class CueServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<CueService>> _logger = new();
        private readonly CueService _service;

        public CueServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new CueFinderDbContext(options);
            _service = new CueService(_context, _logger.Object);
        }

        [Fact]
        public async Task CreateCueAsync_WithValidUser_CreatesCue()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var dto = new CreateCueDto
            {
                Title = "T1",
                Brand = "B1",
                Description = "D1",
                Price = 100,
                Condition = "New",
                Material = "Maple",
                Location = "NY"
            };

            var created = await _service.CreateCueAsync(dto, user.Id);

            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            created.Title.Should().Be("T1");
            created.SellerId.Should().Be(user.Id);
        }

        [Fact]
        public async Task CreateCueAsync_WithMissingUser_Throws()
        {
            var dto = new CreateCueDto
            {
                Title = "T1",
                Brand = "B1",
                Description = "D1",
                Price = 100,
                Condition = "New"
            };

            await Assert.ThrowsAsync<InvalidOperationException>(() => _service.CreateCueAsync(dto, 999));
        }

        [Fact]
        public async Task GetCueByIdAsync_IncrementsViewCount()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cue = new Cue { Title = "T", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, IsSold = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var before = (await _context.Cues.FindAsync(cue.Id))!.ViewCount;
            var dto = await _service.GetCueByIdAsync(cue.Id);
            dto.Should().NotBeNull();
            var after = (await _context.Cues.FindAsync(cue.Id))!.ViewCount;
            after.Should().Be(before + 1);
        }

        [Fact]
        public async Task UpdateCueAsync_WithOwner_UpdatesFields()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cue = new Cue { Title = "Old", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, IsSold = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var update = new UpdateCueDto { Title = "New", Price = 20 };
            var updated = await _service.UpdateCueAsync(cue.Id, update, user.Id);

            updated.Should().NotBeNull();
            updated!.Title.Should().Be("New");
            updated.Price.Should().Be(20);
        }

        [Fact]
        public async Task UpdateCueAsync_WithWrongUser_ThrowsUnauthorized()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cue = new Cue { Title = "Old", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, IsSold = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            await Assert.ThrowsAsync<UnauthorizedAccessException>(() => _service.UpdateCueAsync(cue.Id, new UpdateCueDto { Title = "X" }, 999));
        }

        [Fact]
        public async Task DeleteCueAsync_WithOwner_SoftDeletes()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cue = new Cue { Title = "T", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, IsSold = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var ok = await _service.DeleteCueAsync(cue.Id, user.Id);
            ok.Should().BeTrue();
            (await _context.Cues.FindAsync(cue.Id))!.IsSold.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteCueAsync_WithAdmin_Allows()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            var cue = new Cue { Title = "T", Brand = "B", Description = "D", Price = 10, Condition = "Good", UserId = user.Id, IsSold = false, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var ok = await _service.DeleteCueAsync(cue.Id, 999, isAdmin: true);
            ok.Should().BeTrue();
        }

        [Fact]
        public async Task GetAllCuesAsync_FilterAndSort_Works()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            _context.Cues.AddRange(new[]
            {
                new Cue { Title = "A", Brand = "Predator", Description = "", Price = 100, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new Cue { Title = "B", Brand = "Mezz", Description = "", Price = 200, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();

            var list = await _service.GetAllCuesAsync(brand: "Predator", sortBy: "price_desc");
            list.Should().HaveCount(1);
            list[0].Brand.Should().Be("Predator");
        }

        [Fact]
        public async Task SearchCuesAsync_FindsByTitleOrBrand()
        {
            var user = new User { Username = "u1", PasswordHash = "h", Role = "user", IsActive = true };
            _context.Users.Add(user);
            _context.Cues.AddRange(new[]
            {
                new Cue { Title = "Predator Revo", Brand = "Predator", Description = "Carbon", Price = 100, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new Cue { Title = "Other", Brand = "McDermott", Description = "Maple", Price = 200, Condition = "Good", UserId = user.Id, CreatedAt = DateTime.UtcNow }
            });
            await _context.SaveChangesAsync();

            var results = await _service.SearchCuesAsync("predator");
            results.Should().HaveCount(1);
            results[0].Brand.Should().Be("Predator");
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
