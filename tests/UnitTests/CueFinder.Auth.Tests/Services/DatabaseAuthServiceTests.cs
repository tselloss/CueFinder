using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Models;
using CueFinder.Auth.Services;
using CueFinder.Database.Models;
using CueFinder.Database.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Auth.Tests.Services
{
    public class DatabaseAuthServiceTests
    {
        private readonly Mock<IUserService> _mockUserService;
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly Mock<ILogger<DatabaseAuthService>> _mockLogger;
        private readonly DatabaseAuthService _authService;

        public DatabaseAuthServiceTests()
        {
            _mockUserService = new Mock<IUserService>();
            _mockTokenService = new Mock<ITokenService>();
            _mockLogger = new Mock<ILogger<DatabaseAuthService>>();

            _authService = new DatabaseAuthService(
                _mockUserService.Object,
                _mockTokenService.Object,
                _mockLogger.Object);

            // Setup default token service behavior
            _mockTokenService
                .Setup(x => x.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns("mock_jwt_token");
            _mockTokenService
                .Setup(x => x.GetTokenExpirationSeconds())
                .Returns(3600);
        }

        [Fact]
        public async Task LoginAsync_WithValidUsername_ReturnsAuthResponse()
        {
            // Arrange
            var user = CreateTestUser();
            _mockUserService
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);
            _mockUserService
                .Setup(x => x.UpdateUserAsync(It.IsAny<User>()))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.LoginAsync("testuser", "Password123!");

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock_jwt_token");
            result.Username.Should().Be("testuser");
            result.UserId.Should().Be(1);
            result.Role.Should().Be("user");
        }

        [Fact]
        public async Task LoginAsync_WithValidEmail_ReturnsAuthResponse()
        {
            // Arrange
            var user = CreateTestUser();
            _mockUserService
                .Setup(x => x.GetByUsernameAsync("test@test.com"))
                .ReturnsAsync((User?)null);
            _mockUserService
                .Setup(x => x.GetByEmailAsync("test@test.com"))
                .ReturnsAsync(user);
            _mockUserService
                .Setup(x => x.UpdateUserAsync(It.IsAny<User>()))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.LoginAsync("test@test.com", "Password123!");

            // Assert
            result.Should().NotBeNull();
            result.Email.Should().Be("test@test.com");
        }

        [Fact]
        public async Task LoginAsync_WithNonExistentUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            _mockUserService
                .Setup(x => x.GetByUsernameAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);
            _mockUserService
                .Setup(x => x.GetByEmailAsync(It.IsAny<string>()))
                .ReturnsAsync((User?)null);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync("nonexistent", "password"));
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateTestUser();
            _mockUserService
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync("testuser", "WrongPassword"));
        }

        [Fact]
        public async Task LoginAsync_WithInactiveUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var user = CreateTestUser();
            user.IsActive = false;
            _mockUserService
                .Setup(x => x.GetByUsernameAsync("testuser"))
                .ReturnsAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync("testuser", "Password123!"));
        }

        [Fact]
        public async Task RegisterAsync_WithValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "newuser",
                Password = "Password123!",
                Name = "New User",
                Email = "new@test.com",
                Phone = "555-1234"
            };

            _mockUserService
                .Setup(x => x.UserExistsAsync("newuser"))
                .ReturnsAsync(false);
            _mockUserService
                .Setup(x => x.EmailExistsAsync("new@test.com"))
                .ReturnsAsync(false);
            _mockUserService
                .Setup(x => x.CreateUserAsync(It.IsAny<User>()))
                .ReturnsAsync((User u) => { u.Id = 1; return u; });

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.Username.Should().Be("newuser");
            result.Name.Should().Be("New User");
            result.Email.Should().Be("new@test.com");
            result.Role.Should().Be("user");
        }

        [Fact]
        public async Task RegisterAsync_WithExistingUsername_ThrowsInvalidOperationException()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "existinguser",
                Password = "Password123!",
                Name = "Test User"
            };

            _mockUserService
                .Setup(x => x.UserExistsAsync("existinguser"))
                .ReturnsAsync(true);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ThrowsInvalidOperationException()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "newuser",
                Password = "Password123!",
                Name = "Test User",
                Email = "existing@test.com"
            };

            _mockUserService
                .Setup(x => x.UserExistsAsync("newuser"))
                .ReturnsAsync(false);
            _mockUserService
                .Setup(x => x.EmailExistsAsync("existing@test.com"))
                .ReturnsAsync(true);

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(request));
        }

        [Fact]
        public async Task RegisterAsync_WithShortPassword_ThrowsArgumentException()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "newuser",
                Password = "123",
                Name = "Test User"
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _authService.RegisterAsync(request));
        }

        [Theory]
        [InlineData("", "password", "Name")]
        [InlineData("username", "", "Name")]
        [InlineData("username", "password", "")]
        public async Task RegisterAsync_WithMissingRequiredFields_ThrowsArgumentException(
            string username, string password, string name)
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = username,
                Password = password,
                Name = name
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(
                () => _authService.RegisterAsync(request));
        }

        [Fact]
        public async Task GetUserProfileAsync_WithValidUserId_ReturnsUserProfile()
        {
            // Arrange
            var user = CreateTestUser();
            _mockUserService
                .Setup(x => x.GetUserWithDetailsAsync(1))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.GetUserProfileAsync(1);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(1);
            result.Username.Should().Be("testuser");
            result.Name.Should().Be("Test User");
            result.Email.Should().Be("test@test.com");
        }

        [Fact]
        public async Task GetUserProfileAsync_WithInvalidUserId_ReturnsNull()
        {
            // Arrange
            _mockUserService
                .Setup(x => x.GetUserWithDetailsAsync(999))
                .ReturnsAsync((User?)null);

            // Act
            var result = await _authService.GetUserProfileAsync(999);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateUserProfileAsync_WithValidData_ReturnsUpdatedProfile()
        {
            // Arrange
            var user = CreateTestUser();
            user.Id = 1;

            _mockUserService
                .Setup(x => x.GetUserWithDetailsAsync(1))
                .ReturnsAsync(user);
            _mockUserService
                .Setup(x => x.EmailExistsAsync("updated@test.com"))
                .ReturnsAsync(false);
            _mockUserService
                .Setup(x => x.UpdateUserAsync(It.IsAny<User>()))
                .ReturnsAsync(user);

            // Act
            var result = await _authService.UpdateUserProfileAsync(1, "Updated Name", "updated@test.com", "555-9999");

            // Assert
            result.Should().NotBeNull();
            _mockUserService.Verify(x => x.UpdateUserAsync(It.IsAny<User>()), Times.Once);
        }

        private User CreateTestUser()
        {
            // Password123! hashed with SHA256
            using (var sha256 = System.Security.Cryptography.SHA256.Create())
            {
                var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes("Password123!"));
                var passwordHash = Convert.ToBase64String(hashBytes);
                
                return new User
                {
                    Id = 1,
                    Username = "testuser",
                    PasswordHash = passwordHash,
                    Name = "Test User",
                    Email = "test@test.com",
                    Phone = "555-1234",
                    Role = "user",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
            }
        }
    }
}
