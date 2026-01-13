using CueFinder.Auth.Interfaces;
using CueFinder.Auth.Models;
using CueFinder.Auth.Services;
using FluentAssertions;
using Moq;
using Xunit;

namespace CueFinder.Auth.Tests.Services
{
    public class AuthServiceTests : IDisposable
    {
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _mockTokenService = new Mock<ITokenService>();
            
            // Reset static state before each test using reflection
            ResetAuthServiceStaticState();
            
            _authService = new AuthService(_mockTokenService.Object);

            // Setup default token service behavior
            _mockTokenService
                .Setup(x => x.GenerateToken(It.IsAny<int>(), It.IsAny<string>(), It.IsAny<string>()))
                .Returns("mock_jwt_token");
            _mockTokenService
                .Setup(x => x.GetTokenExpirationSeconds())
                .Returns(3600);
        }

        private void ResetAuthServiceStaticState()
        {
            // Use reflection to reset the static Users list back to original state
            var authServiceType = typeof(CueFinder.Auth.Services.AuthService);
            var usersField = authServiceType.GetField("Users", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            var nextUserIdField = authServiceType.GetField("_nextUserId", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
            
            if (usersField != null)
            {
                // Get the list and clear it
                var usersList = usersField.GetValue(null) as System.Collections.IList;
                if (usersList != null)
                {
                    usersList.Clear();
                    
                    // Re-add the original two users using dynamic
                    var userDataType = authServiceType.GetNestedType("UserData", System.Reflection.BindingFlags.NonPublic);
                    if (userDataType != null)
                    {
                        // Create admin user
                        var adminUser = Activator.CreateInstance(userDataType);
                        userDataType.GetProperty("Id")!.SetValue(adminUser, 1);
                        userDataType.GetProperty("Username")!.SetValue(adminUser, "admin");
                        userDataType.GetProperty("Password")!.SetValue(adminUser, "admin123");
                        userDataType.GetProperty("Name")!.SetValue(adminUser, "Administrator");
                        userDataType.GetProperty("Email")!.SetValue(adminUser, "admin@cuefinder.com");
                        userDataType.GetProperty("Phone")!.SetValue(adminUser, "555-0001");
                        userDataType.GetProperty("Role")!.SetValue(adminUser, "admin");
                        userDataType.GetProperty("CreatedAt")!.SetValue(adminUser, DateTime.UtcNow.AddDays(-30));
                        usersList.Add(adminUser);
                        
                        // Create regular user
                        var regularUser = Activator.CreateInstance(userDataType);
                        userDataType.GetProperty("Id")!.SetValue(regularUser, 2);
                        userDataType.GetProperty("Username")!.SetValue(regularUser, "user");
                        userDataType.GetProperty("Password")!.SetValue(regularUser, "user123");
                        userDataType.GetProperty("Name")!.SetValue(regularUser, "Regular User");
                        userDataType.GetProperty("Email")!.SetValue(regularUser, "user@cuefinder.com");
                        userDataType.GetProperty("Phone")!.SetValue(regularUser, "555-0002");
                        userDataType.GetProperty("Role")!.SetValue(regularUser, "user");
                        userDataType.GetProperty("CreatedAt")!.SetValue(regularUser, DateTime.UtcNow.AddDays(-20));
                        usersList.Add(regularUser);
                    }
                }
            }
            
            if (nextUserIdField != null)
            {
                nextUserIdField.SetValue(null, 3);
            }
        }

        public void Dispose()
        {
            // Reset static state after test
            ResetAuthServiceStaticState();
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ReturnsAuthResponse()
        {
            // Arrange
            string username = "admin";
            string password = "admin123";

            // Act
            var result = await _authService.LoginAsync(username, password);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock_jwt_token");
            result.Username.Should().Be("admin");
            result.Role.Should().Be("admin");
            result.ExpiresIn.Should().Be(3600);
            result.Name.Should().NotBeNullOrEmpty();
            result.Email.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task LoginAsync_WithEmailInsteadOfUsername_ReturnsAuthResponse()
        {
            // Arrange
            string email = "admin@cuefinder.com";
            string password = "admin123";

            // Act
            var result = await _authService.LoginAsync(email, password);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock_jwt_token");
            result.Email.Should().Be(email);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidUsername_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            string username = "nonexistent";
            string password = "password123";

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync(username, password));
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            string username = "admin";
            string password = "wrongpassword";

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync(username, password));
        }

        [Fact]
        public async Task RegisterAsync_WithValidRequest_ReturnsAuthResponse()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "newuser",
                Password = "password123",
                Name = "New User",
                Email = "newuser@test.com",
                Phone = "555-1234"
            };

            // Act
            var result = await _authService.RegisterAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.AccessToken.Should().Be("mock_jwt_token");
            result.Username.Should().Be("newuser");
            result.Name.Should().Be("New User");
            result.Email.Should().Be("newuser@test.com");
            result.Phone.Should().Be("555-1234");
            result.Role.Should().Be("user");
        }

        [Fact]
        public async Task RegisterAsync_WithExistingUsername_ThrowsInvalidOperationException()
        {
            // Arrange
            var request = new RegisterRequest
            {
                Username = "admin", // Already exists
                Password = "password123",
                Name = "Test User"
            };

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
                Password = "password123",
                Name = "Test User",
                Email = "admin@cuefinder.com" // Already exists
            };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(request));
        }

        [Theory]
        [InlineData("", "password123", "Name")]
        [InlineData("username", "", "Name")]
        [InlineData("username", "password123", "")]
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
            int userId = 1;

            // Act
            var result = await _authService.GetUserProfileAsync(userId);

            // Assert
            result.Should().NotBeNull();
            result!.Id.Should().Be(userId);
            result.Username.Should().Be("admin");
            result.Name.Should().Be("Administrator");
            result.Email.Should().Be("admin@cuefinder.com");
            result.Role.Should().Be("admin");
        }

        [Fact]
        public async Task GetUserProfileAsync_WithInvalidUserId_ReturnsNull()
        {
            // Arrange
            int userId = 999;

            // Act
            var result = await _authService.GetUserProfileAsync(userId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateUserProfileAsync_WithValidData_ReturnsUpdatedProfile()
        {
            // Arrange
            int userId = 1;

            // Act
            var result = await _authService.UpdateUserProfileAsync(userId, "Updated Name", "updated@test.com", "555-9999", "", "", "", "", "", "", null);

            // Assert
            result.Should().NotBeNull();
            result!.Name.Should().Be("Updated Name");
            result.Email.Should().Be("updated@test.com");
            result.Phone.Should().Be("555-9999");
        }

        [Fact]
        public async Task UpdateUserProfileAsync_WithInvalidUserId_ReturnsNull()
        {
            // Arrange
            int userId = 999;

            // Act
            var result = await _authService.UpdateUserProfileAsync(userId, "Updated Name", "", "", "", "", "", "", "", "", null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateUserProfileAsync_WithExistingEmail_ThrowsInvalidOperationException()
        {
            // Arrange
            int userId = 2;

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.UpdateUserProfileAsync(userId, "", "admin@cuefinder.com", "", "", "", "", "", "", "", null)); // Already used by another user
        }
    }
}
