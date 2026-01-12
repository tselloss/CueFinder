using CueFinder.CueCases.Services;
using CueFinder.CueCases.Models;
using CueFinder.Database.Models;
using CueFinder.Database.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Xunit;
using CueFinder.CueCases.Interfaces;
using Microsoft.AspNetCore.Http;

namespace CueFinder.CueCases.IntegrationTests
{
    public class CueCaseServiceIntegrationTests : DatabaseTestBase
    {
        private CueCaseService? _service;

        private void EnsureInit()
        {
            if (_service == null)
            {
                var logger = new TestLogger<CueCaseService>();
                var imageService = new TestImageService();
                _service = new CueCaseService(Context, logger, imageService);
            }
        }

        // Test stub for IImageService
        private class TestImageService : IImageService
        {
            public Task<List<CueCaseImageDto>> UploadImagesAsync(int cueCaseId, List<IFormFile> files, int userId) => Task.FromResult(new List<CueCaseImageDto>());
            public Task<bool> DeleteImageAsync(int imageId, int userId) => Task.FromResult(true);
            public Task<bool> SetPrimaryImageAsync(int imageId, int cueCaseId, int userId) => Task.FromResult(true);
            public Task<List<CueCaseImageDto>> GetCueCaseImagesAsync(int cueCaseId) => Task.FromResult(new List<CueCaseImageDto>());
            public Task DeleteCueCaseImagesInternalAsync(int cueCaseId) => Task.CompletedTask;
        }

        #region Create Tests

        [Fact]
        public async Task CreateCueCase_ValidData_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("create_case_user");

            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "New Case",
                Brand = "JB Cases",
                Description = "High quality case",
                Price = 250,
                Condition = "Excellent",
                CaseCapacity = "2x4",
                CaseOpening = "Top",
                CaseType = "Hard"
            }, user.Id);

            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            created.Title.Should().Be("New Case");
            created.Brand.Should().Be("JB Cases");
            created.Price.Should().Be(250);
        }

        [Fact]
        public async Task CreateCueCase_InvalidUserId_ThrowsException()
        {
            EnsureInit();

            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _service!.CreateCueCaseAsync(new CreateCueCaseDto
                {
                    Title = "Test Case",
                    Brand = "Brand",
                    Price = 200
                }, 99999));
        }

        #endregion

        #region Get Tests

        [Fact]
        public async Task GetCueCaseById_ValidId_ReturnsCueCase()
        {
            EnsureInit();
            var user = await CreateTestUser("get_case_user");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Get Test Case",
                Brand = "Instroke",
                Price = 300,
                CaseCapacity = "3x5"
            }, user.Id);

            var fetched = await _service!.GetCueCaseByIdAsync(created.Id);

            fetched.Should().NotBeNull();
            fetched!.Id.Should().Be(created.Id);
            fetched.Title.Should().Be("Get Test Case");
        }

        [Fact]
        public async Task GetCueCaseById_InvalidId_ReturnsNull()
        {
            EnsureInit();

            var fetched = await _service!.GetCueCaseByIdAsync(99999);

            fetched.Should().BeNull();
        }

        [Fact]
        public async Task GetAllCueCases_WithFilters_ReturnsFilteredResults()
        {
            EnsureInit();
            var user = await CreateTestUser("filter_case_user");
            
            await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "JB Case 1",
                Brand = "JB Cases",
                Price = 250,
                Condition = "Excellent",
                CaseCapacity = "2x4"
            }, user.Id);
            
            await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Instroke Case",
                Brand = "Instroke",
                Price = 350,
                Condition = "Good",
                CaseCapacity = "3x5"
            }, user.Id);

            var filtered = await _service!.GetAllCueCasesAsync(condition: "Excellent");

            filtered.Should().HaveCountGreaterOrEqualTo(1);
            filtered.Should().Contain(c => c.Title == "JB Case 1");
        }

        [Fact]
        public async Task GetUserCueCases_ReturnsOnlyUserCases()
        {
            EnsureInit();
            var user1 = await CreateTestUser("user1_cases");
            var user2 = await CreateTestUser("user2_cases");
            
            await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "User 1 Case",
                Brand = "Brand1",
                Price = 200,
                CaseCapacity = "2x4"
            }, user1.Id);
            
            await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "User 2 Case",
                Brand = "Brand2",
                Price = 250,
                CaseCapacity = "3x5"
            }, user2.Id);

            var user1Cases = await _service!.GetUserCueCasesAsync(user1.Id);

            user1Cases.Should().HaveCountGreaterOrEqualTo(1);
            user1Cases.Should().Contain(c => c.Title == "User 1 Case");
            user1Cases.Should().NotContain(c => c.Title == "User 2 Case");
        }

        [Fact]
        public async Task SearchCueCases_FindsByTitleAndBrand()
        {
            EnsureInit();
            var user = await CreateTestUser("search_case_user");
            
            await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Premium Edition Case",
                Brand = "JB Cases",
                Price = 400,
                CaseCapacity = "4x8"
            }, user.Id);

            var results = await _service!.SearchCueCasesAsync("Premium");

            results.Should().HaveCountGreaterOrEqualTo(1);
            results.Should().Contain(c => c.Title.Contains("Premium"));
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateCueCase_AsOwner_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("update_case_user");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Original Case Title",
                Brand = "Original Brand",
                Price = 250,
                CaseCapacity = "2x4"
            }, user.Id);

            var updated = await _service!.UpdateCueCaseAsync(created.Id, new UpdateCueCaseDto
            {
                Title = "Updated Case Title",
                Price = 300,
                Condition = "Very Good"
            }, user.Id);

            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Updated Case Title");
            updated.Price.Should().Be(300);
            updated.Condition.Should().Be("Very Good");
        }

        [Fact]
        public async Task UpdateCueCase_NotOwner_ThrowsUnauthorizedException()
        {
            EnsureInit();
            var owner = await CreateTestUser("case_owner");
            var otherUser = await CreateTestUser("other_case_user");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Owner's Case",
                Brand = "Brand",
                Price = 220,
                CaseCapacity = "2x4"
            }, owner.Id);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service!.UpdateCueCaseAsync(created.Id, new UpdateCueCaseDto
                {
                    Title = "Hacked"
                }, otherUser.Id));
        }

        [Fact]
        public async Task UpdateCueCase_InvalidId_ReturnsNull()
        {
            EnsureInit();
            var user = await CreateTestUser("update_invalid_case");

            var result = await _service!.UpdateCueCaseAsync(99999, new UpdateCueCaseDto
            {
                Title = "Won't Work"
            }, user.Id);

            result.Should().BeNull();
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteCueCase_AsOwner_Success()
        {
            EnsureInit();
            var user = await CreateTestUser("delete_case_user");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "To Be Deleted Case",
                Brand = "Brand",
                Price = 180,
                CaseCapacity = "2x4"
            }, user.Id);

            var deleted = await _service!.DeleteCueCaseAsync(created.Id, user.Id, isAdmin: false);

            deleted.Should().BeTrue();
            var fetched = await _service!.GetCueCaseByIdAsync(created.Id);
            fetched.Should().BeNull();
        }

        [Fact]
        public async Task DeleteCueCase_AsAdmin_Success()
        {
            EnsureInit();
            var owner = await CreateTestUser("case_owner2");
            var admin = await CreateTestUser("admin_case_user");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Admin Delete Test Case",
                Brand = "Brand",
                Price = 280,
                CaseCapacity = "3x6"
            }, owner.Id);

            var deleted = await _service!.DeleteCueCaseAsync(created.Id, admin.Id, isAdmin: true);

            deleted.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteCueCase_NotOwnerNotAdmin_ThrowsUnauthorizedException()
        {
            EnsureInit();
            var owner = await CreateTestUser("owner3");
            var otherUser = await CreateTestUser("other3");
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "Protected Case",
                Brand = "Brand",
                Price = 320,
                CaseCapacity = "2x4"
            }, owner.Id);

            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _service!.DeleteCueCaseAsync(created.Id, otherUser.Id, isAdmin: false));
        }

        [Fact]
        public async Task DeleteCueCase_InvalidId_ReturnsFalse()
        {
            EnsureInit();
            var user = await CreateTestUser("delete_invalid_case");

            var result = await _service!.DeleteCueCaseAsync(99999, user.Id, isAdmin: false);

            result.Should().BeFalse();
        }

        #endregion

        #region Full Flow Test

        [Fact]
        public async Task CreateGetUpdateDeleteCueCase_EndToEnd_Works()
        {
            EnsureInit();
            var user = await CreateTestUser("it_case_user");

            // Create
            var created = await _service!.CreateCueCaseAsync(new CreateCueCaseDto
            {
                Title = "IT Case",
                Brand = "JB",
                Description = "Desc",
                Price = 250,
                Condition = "Excellent",
                CaseCapacity = "2x4",
                CaseOpening = "Top",
                CaseType = "Hard"
            }, user.Id);

            created.Id.Should().BeGreaterThan(0);

            // Get
            var fetched = await _service!.GetCueCaseByIdAsync(created.Id);
            fetched!.Title.Should().Be("IT Case");

            // Update
            var updated = await _service!.UpdateCueCaseAsync(created.Id, new UpdateCueCaseDto
            {
                Price = 300,
                Title = "Updated IT Case"
            }, user.Id);
            updated!.Price.Should().Be(300);
            updated.Title.Should().Be("Updated IT Case");

            // Delete
            var deleted = await _service!.DeleteCueCaseAsync(created.Id, user.Id, isAdmin: false);
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

