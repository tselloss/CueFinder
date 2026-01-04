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
    public class UserServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<IUserRepository> _mockRepository;
        private readonly Mock<ILogger<UserService>> _mockLogger;
        private readonly UserService _service;

        public UserServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            _mockRepository = new Mock<IUserRepository>();
            _mockLogger = new Mock<ILogger<UserService>>();
            _service = new UserService(_mockRepository.Object, _context, _mockLogger.Object);
        }

        [Fact]
        public async Task GetUserWithDetailsAsync_WithValidId_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            _mockRepository
                .Setup(x => x.GetByIdAsync(1))
                .ReturnsAsync(user);

            // Act
            var result = await _service.GetUserWithDetailsAsync(1);

            // Assert
            result.Should().NotBeNull();
            result!.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task GetUserWithDetailsAsync_WithInvalidId_ReturnsNull()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.GetByIdAsync(999))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _service.GetUserWithDetailsAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetByUsernameAsync_WithExistingUsername_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            _mockRepository
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);

            // Act
            var result = await _service.GetByUsernameAsync("testuser");

            // Assert
            result.Should().NotBeNull();
            result!.Username.Should().Be("testuser");
        }

        [Fact]
        public async Task GetByEmailAsync_WithExistingEmail_ReturnsUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            user.Email = "test@test.com";
            _mockRepository
                .Setup(x => x.GetByEmailAsync("test@test.com"))
                .ReturnsAsync(user);

            // Act
            var result = await _service.GetByEmailAsync("test@test.com");

            // Assert
            result.Should().NotBeNull();
            result!.Email.Should().Be("test@test.com");
        }

        [Fact]
        public async Task CreateUserAsync_WithValidUser_ReturnsCreatedUser()
        {
            // Arrange
            var user = CreateTestUser("newuser");
            _mockRepository
                .Setup(x => x.UserExistsAsync("newuser"))
                .ReturnsAsync(false);
            _mockRepository
                .Setup(x => x.EmailExistsAsync(user.Email))
                .ReturnsAsync(false);
            _mockRepository
                .Setup(x => x.AddAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => { u.Id = 1; return u; });

            // Act
            var result = await _service.CreateUserAsync(user);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be("newuser");
            _mockRepository.Verify(x => x.AddAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task CreateUserAsync_WithExistingUsername_ThrowsException()
        {
            // Arrange
            var user = CreateTestUser("existinguser");
            _mockRepository
                .Setup(x => x.UserExistsAsync("existinguser"))
                .ReturnsAsync(true);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateUserAsync(user));
        }

        [Fact]
        public async Task CreateUserAsync_WithExistingEmail_ThrowsException()
        {
            // Arrange
            var user = CreateTestUser("newuser");
            user.Email = "existing@test.com";
            _mockRepository
                .Setup(x => x.UserExistsAsync("newuser"))
                .ReturnsAsync(false);
            _mockRepository
                .Setup(x => x.EmailExistsAsync("existing@test.com"))
                .ReturnsAsync(true);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.CreateUserAsync(user));
        }

        [Fact]
        public async Task UpdateUserAsync_WithValidUser_ReturnsUpdatedUser()
        {
            // Arrange
            var user = CreateTestUser("testuser");
            user.Id = 1;
            user.Name = "Updated Name";

            _mockRepository
                .Setup(x => x.UpdateAsync(It.IsAny<User>()))
                .ReturnsAsync(user);

            // Act
            var result = await _service.UpdateUserAsync(user);

            // Assert
            result.Should().NotBeNull();
            result.Name.Should().Be("Updated Name");
            _mockRepository.Verify(x => x.UpdateAsync(It.IsAny<User>()), Times.Once);
        }

        [Fact]
        public async Task DeleteUserAsync_WithValidId_ReturnsTrue()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.DeleteAsync(1))
                .ReturnsAsync(true);

            // Act
            var result = await _service.DeleteUserAsync(1);

            // Assert
            result.Should().BeTrue();
            _mockRepository.Verify(x => x.DeleteAsync(1), Times.Once);
        }

        [Fact]
        public async Task DeleteUserAsync_WithInvalidId_ReturnsFalse()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.DeleteAsync(999))
                .ReturnsAsync(false);

            // Act
            var result = await _service.DeleteUserAsync(999);

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task UserExistsAsync_WithExistingUser_ReturnsTrue()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.UserExistsAsync("existinguser"))
                .ReturnsAsync(true);

            // Act
            var result = await _service.UserExistsAsync("existinguser");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task UserExistsAsync_WithNonExistingUser_ReturnsFalse()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.UserExistsAsync("nonexistent"))
                .ReturnsAsync(false);

            // Act
            var result = await _service.UserExistsAsync("nonexistent");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task EmailExistsAsync_WithExistingEmail_ReturnsTrue()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.EmailExistsAsync("existing@test.com"))
                .ReturnsAsync(true);

            // Act
            var result = await _service.EmailExistsAsync("existing@test.com");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task EmailExistsAsync_WithNonExistingEmail_ReturnsFalse()
        {
            // Arrange
            _mockRepository
                .Setup(x => x.EmailExistsAsync("nonexistent@test.com"))
                .ReturnsAsync(false);

            // Act
            var result = await _service.EmailExistsAsync("nonexistent@test.com");

            // Assert
            result.Should().BeFalse();
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
