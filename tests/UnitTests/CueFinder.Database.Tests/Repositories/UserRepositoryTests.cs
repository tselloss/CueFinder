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
    public class UserRepositoryTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly UserRepository _repository;
        private readonly Mock<ILogger<UserRepository>> _mockLogger;

        public UserRepositoryTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _mockLogger = new Mock<ILogger<UserRepository>>();
            _repository = new UserRepository(_context, _mockLogger.Object);
        }

        [Fact]
        public async Task GetByUsernameAsync_WithExistingUser_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUsernameAsync("testuser");

            // Assert
            result.Should().NotBeNull();
            result!.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task GetByUsernameAsync_WithNonExistentUser_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByUsernameAsync("nonexistent");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByUsernameAsync_IsCaseInsensitive()
        {
            // Arrange
            var user = CreateTestUser("TestUser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByUsernameAsync("testuser");

            // Assert
            result.Should().NotBeNull();
            result!.Username.Should().Be("TestUser");
        }

        [Fact]
        public async Task GetByEmailAsync_WithExistingEmail_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            user.Email = "test@test.com";
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("test@test.com");

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be("test@test.com");
        }

        [Fact]
        public async Task GetByEmailAsync_IsCaseInsensitive()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            user.Email = "Test@Test.COM";
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByEmailAsync("test@test.com");

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be("Test@Test.COM");
        }

        [Fact]
        public async Task GetUsersByRoleAsync_ReturnsUsersWithRole()
        {
            // Arrange
            var adminUser = CreateTestUser("admin1");
            adminUser.Role = "admin";
            var regularUser = CreateTestUser("user1");
            regularUser.Role = "user";

            await _context.Users.AddRangeAsync(adminUser, regularUser);
            await _context.SaveChangesAsync();

            // Act
            var admins = await _repository.GetUsersByRoleAsync("admin");

            // Assert
            admins.Should().HaveCount(1);
            admins.First().Role.Should().Be("admin");
        }

        [Fact]
        public async Task UserExistsAsync_WithExistingUser_ReturnsTrue()
        {
            // Arrange
            var user = CreateTestUser("existinguser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.UserExistsAsync("existinguser");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UserExistsAsync_WithNonExistentUser_ReturnsFalse()
        {
            // Act
            var result = await _repository.UserExistsAsync("nonexistent");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task EmailExistsAsync_WithExistingEmail_ReturnsTrue()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            user.Email = "existing@test.com";
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.EmailExistsAsync("existing@test.com");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task EmailExistsAsync_WithNonExistentEmail_ReturnsFalse()
        {
            // Act
            var result = await _repository.EmailExistsAsync("nonexistent@test.com");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task AddAsync_AddsUserToDatabase()
        {
            // Arrange
            var user = CreateTestUser("newuser");

            // Act
            var result = await _repository.AddAsync(user);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().BeGreaterThan(0);
            _context.Users.Should().Contain(u => u.Username == "newuser");
        }

        [Fact]
        public async Task UpdateAsync_UpdatesUserInDatabase()
        {
            // Arrange
            var user = CreateTestUser("updateuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            user.Name = "Updated Name";
            var result = await _repository.UpdateAsync(user);

            // Assert
            result.Name.Should().Be("Updated Name");
            var updatedUser = await _context.Users.FindAsync(user.Id);
            updatedUser!.Name.Should().Be("Updated Name");
        }

        [Fact]
        public async Task DeleteAsync_RemovesUserFromDatabase()
        {
            // Arrange
            var user = CreateTestUser("deleteuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            var userId = user.Id;

            // Act
            var result = await _repository.DeleteAsync(userId);

            // Assert
            result.Should().BeTrue();
            var deletedUser = await _context.Users.FindAsync(userId);
            deletedUser.Should().BeNull();
        }

        [Fact]
        public async Task GetByIdAsync_WithExistingId_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetByIdAsync(user.Id);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(user.Id);
        }

        [Fact]
        public async Task GetAllAsync_ReturnsAllUsers()
        {
            // Arrange
            var user1 = CreateTestUser("user1");
            var user2 = CreateTestUser("user2");
            await _context.Users.AddRangeAsync(user1, user2);
            await _context.SaveChangesAsync();

            // Act
            var result = await _repository.GetAllAsync();

            // Assert
            result.Should().HaveCount(2);
        }

        private User CreateTestUser(string username)
        {
            return new User
            {
                Username = username,
                PasswordHash = "hashed_password",
                Name = $"{username} Name",
                Email = $"{username}@test.com",
                Phone = "555-0000",
                Role = "user",
                IsActive = true,
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
