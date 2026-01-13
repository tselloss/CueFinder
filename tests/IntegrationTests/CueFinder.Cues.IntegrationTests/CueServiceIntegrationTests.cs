using CueFinder.Cues.Services;
using CueFinder.Cues.Models;
using CueFinder.Database.Models;
using CueFinder.Database.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Xunit;
using CueFinder.Extensions.Images;
using Microsoft.AspNetCore.Http;

namespace CueFinder.Cues.IntegrationTests
{
    public class CueServiceIntegrationTests : DatabaseTestBase
    {
        private CueService? _service;

        private void EnsureInit()
        {
            if (_service == null)
            {
                var logger = new TestLogger<CueService>();
                var imageService = new TestImageService();
                _service = new CueService(Context, logger, imageService);
            }
        }

        // Test stub for IImageService
        private class TestImageService : IImageService
        {
            public Task<ImageUploadResponse> UploadImageAsync(ImageUploadRequest request, int userId) => Task.FromResult(new ImageUploadResponse());
            public Task<List<ImageUploadResponse>> UploadMultipleImagesAsync(List<IFormFile> files, int cueId, int userId) => Task.FromResult(new List<ImageUploadResponse>());
            public Task<bool> DeleteImageAsync(int imageId, int userId) => Task.FromResult(true);
            public Task<CueImage?> GetImageAsync(int imageId) => Task.FromResult<CueImage?>(null);
            public Task<List<CueImage>> GetCueImagesAsync(int cueId) => Task.FromResult(new List<CueImage>());
            public Task<bool> SetPrimaryImageAsync(int imageId, int userId) => Task.FromResult(true);
            public Task<bool> UpdateImageOrderAsync(int imageId, int newOrder) => Task.FromResult(true);
            public Task<bool> DeleteCueImagesAsync(int cueId, int userId) => Task.FromResult(true);
            public Task DeleteCueImagesInternalAsync(int cueId) => Task.CompletedTask;
            public void EnsureStorageRootExists() { }
            public Task<(bool IsValid, string? ErrorMessage)> ValidateImageAsync(IFormFile file) => Task.FromResult((true, (string?)null));
            public string GetImageUrl(string fileName) => $"/uploads/cues/{fileName}";
        }

        #region Create Tests

        [Fact]
        public async Task CreateCue_ValidData_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("create_user");

            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "New Cue",
                Brand = "Predator",
                Description = "High quality cue",
                Price = 1000,
                Condition = "Excellent",
                Material = "Carbon",
                Length = 58,
                Weight = 19,
                TipSize = 12.75m
            }, user.Id);

            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            created.Title.Should().Be("New Cue");
            created.Brand.Should().Be("Predator");
            created.Price.Should().Be(1000);
        }

        [Fact]
        public async Task CreateCue_InvalidUserId_ThrowsException()
        {
            EnsureInit();

            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _service!.CreateCueAsync(new CreateCueDto
                {
                    Title = "Test Cue",
                    Brand = "Brand",
                    Price = 500
                }, 99999));
        }

        #endregion

        #region Get Tests

        [Fact]
        public async Task GetCueById_ValidId_ReturnsCue()
        {
            EnsureInit();
            var user = await CreateTestUser("get_user");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Get Test Cue",
                Brand = "Schmelke",
                Price = 800
            }, user.Id);

            var fetched = await _service!.GetCueByIdAsync(created.Id);

            fetched.Should().NotBeNull();
            fetched!.Id.Should().Be(created.Id);
            fetched.Title.Should().Be("Get Test Cue");
        }

        [Fact]
        public async Task GetCueById_InvalidId_ReturnsNull()
        {
            EnsureInit();

            var fetched = await _service!.GetCueByIdAsync(99999);

            fetched.Should().BeNull();
        }

        [Fact]
        public async Task GetAllCues_WithFilters_ReturnsFilteredResults()
        {
            EnsureInit();
            var user = await CreateTestUser("filter_user");
            
            await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Predator Cue 1",
                Brand = "Predator",
                Price = 1000,
                Condition = "Excellent"
            }, user.Id);
            
            await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Schmelke Cue",
                Brand = "Schmelke",
                Price = 800,
                Condition = "Good"
            }, user.Id);

            var filtered = await _service!.GetAllCuesAsync(condition: "Excellent");

            filtered.Should().HaveCountGreaterOrEqualTo(1);
            filtered.Should().Contain(c => c.Title == "Predator Cue 1");
        }

        [Fact]
        public async Task GetUserCues_ReturnsOnlyUserCues()
        {
            EnsureInit();
            var user1 = await CreateTestUser("user1_cues");
            var user2 = await CreateTestUser("user2_cues");
            
            await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "User 1 Cue",
                Brand = "Brand1",
                Price = 500
            }, user1.Id);
            
            await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "User 2 Cue",
                Brand = "Brand2",
                Price = 600
            }, user2.Id);

            var user1Cues = await _service!.GetUserCuesAsync(user1.Id);

            user1Cues.Should().HaveCountGreaterOrEqualTo(1);
            user1Cues.Should().Contain(c => c.Title == "User 1 Cue");
            user1Cues.Should().NotContain(c => c.Title == "User 2 Cue");
        }

        [Fact]
        public async Task SearchCues_FindsByTitleAndBrand()
        {
            EnsureInit();
            var user = await CreateTestUser("search_user");
            
            await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Special Edition Cue",
                Brand = "Predator",
                Price = 1500
            }, user.Id);

            var results = await _service!.SearchCuesAsync("Special");

            results.Should().HaveCountGreaterOrEqualTo(1);
            results.Should().Contain(c => c.Title.Contains("Special"));
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateCue_AsOwner_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("update_user");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Original Title",
                Brand = "Original Brand",
                Price = 1000
            }, user.Id);

            var updated = await _service!.UpdateCueAsync(created.Id, new UpdateCueDto
            {
                Title = "Updated Title",
                Price = 1200,
                Condition = "Very Good"
            }, user.Id);

            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Updated Title");
            updated.Price.Should().Be(1200);
            updated.Condition.Should().Be("Very Good");
        }

        [Fact]
        public async Task UpdateCue_NotOwner_ThrowsUnauthorizedException()
        {
            EnsureInit();
            var owner = await CreateTestUser("owner");
            var otherUser = await CreateTestUser("other_user");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Owner's Cue",
                Brand = "Brand",
                Price = 900
            }, owner.Id);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service!.UpdateCueAsync(created.Id, new UpdateCueDto
                {
                    Title = "Hacked"
                }, otherUser.Id));
        }

        [Fact]
        public async Task UpdateCue_InvalidId_ReturnsNull()
        {
            EnsureInit();
            var user = await CreateTestUser("update_invalid");

            var result = await _service!.UpdateCueAsync(99999, new UpdateCueDto
            {
                Title = "Won't Work"
            }, user.Id);

            result.Should().BeNull();
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteCue_AsOwner_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("delete_user");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "To Be Deleted",
                Brand = "Brand",
                Price = 500
            }, user.Id);

            var deleted = await _service!.DeleteCueAsync(created.Id, user.Id);
            deleted.Should().BeTrue();

            // Verify soft delete happened in database
            var cueInDb = await Context!.Cues.FindAsync(created.Id);
            cueInDb.Should().NotBeNull();
            cueInDb!.IsSold.Should().BeTrue("soft delete should set IsSold=true");

            // Verify soft delete: GetCueById should return null for soft-deleted cues
            // We need to clear tracking to avoid EF returning cached entity
            Context!.ChangeTracker.Clear();
            var fetched = await _service!.GetCueByIdAsync(created.Id);
            fetched.Should().BeNull("GetCueByIdAsync should filter out soft-deleted cues");
        }

        [Fact]
        public async Task DeleteCue_AsAdmin_Success()
        {
            EnsureInit();
            var owner = await CreateTestUser("cue_owner");
            var admin = await CreateTestUser("admin_user");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Admin Delete Test",
                Brand = "Brand",
                Price = 700
            }, owner.Id);

            var deleted = await _service!.DeleteCueAsync(created.Id, admin.Id, isAdmin: true);

            deleted.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteCue_NotOwnerNotAdmin_ThrowsUnauthorizedException()
        {
            EnsureInit();
            var owner = await CreateTestUser("owner2");
            var otherUser = await CreateTestUser("other2");
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "Protected Cue",
                Brand = "Brand",
                Price = 850
            }, owner.Id);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service!.DeleteCueAsync(created.Id, otherUser.Id, isAdmin: false));
        }

        [Fact]
        public async Task DeleteCue_InvalidId_ReturnsFalse()
        {
            EnsureInit();
            var user = await CreateTestUser("delete_invalid");

            var result = await _service!.DeleteCueAsync(99999, user.Id);

            result.Should().BeFalse();
        }

        #endregion

        #region Full Flow Test

        [Fact]
        public async Task CreateGetUpdateDeleteCue_EndToEnd_Works()
        {
            EnsureInit();
            var user = await CreateTestUser("it_user");

            // Create
            var created = await _service!.CreateCueAsync(new CreateCueDto
            {
                Title = "IT Cue",
                Brand = "Predator",
                Description = "Desc",
                Price = 1000,
                Condition = "Excellent",
                Material = "Carbon"
            }, user.Id);

            created.Id.Should().BeGreaterThan(0);

            // Get
            var fetched = await _service!.GetCueByIdAsync(created.Id);
            fetched!.Title.Should().Be("IT Cue");

            // Update
            var updated = await _service!.UpdateCueAsync(created.Id, new UpdateCueDto
            {
                Price = 1200,
                Title = "Updated IT Cue"
            }, user.Id);
            updated!.Price.Should().Be(1200);
            updated.Title.Should().Be("Updated IT Cue");

            // Delete
            var deleted = await _service!.DeleteCueAsync(created.Id, user.Id);
            deleted.Should().BeTrue();
        }

        #endregion

        #region Helper Methods

        private async Task<User> CreateTestUser(string username)
        {
            var user = new User
            {
                Username = username,
                PasswordHash = "hash",
                Name = username + " Name",
                Email = $"{username}@test.com",
                Phone = "555-1111",
                Role = "user",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            Context.Users.Add(user);
            await Context.SaveChangesAsync();
            return user;
        }

        #endregion

        private class TestLogger<T> : ILogger<T>
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => false;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
        }
    }
}

