using CueFinder.Auth.Models;
using CueFinder.Auth.Services;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using CueFinder.Database.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace CueFinder.Auth.IntegrationTests
{
    public class AuthServiceIntegrationTests : DatabaseTestBase
    {
        private DatabaseAuthService GetAuthService()
        {
            var configData = new Dictionary<string, string>
            {
                {"JwtSettings:SecretKey", "ThisIsAVerySecureSecretKeyForTestingPurposesOnly123456789"},
                {"JwtSettings:Issuer", "CueFinderTestIssuer"},
                {"JwtSettings:Audience", "CueFinderTestAudience"},
                {"JwtSettings:ExpirationMinutes", "60"}
            };
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(configData!)
                .Build();

            var userRepoLogger = new TestLogger<UserRepository>();
            var userServiceLogger = new TestLogger<UserService>();
            var authLogger = new TestLogger<DatabaseAuthService>();

            var userRepository = new UserRepository(Context, userRepoLogger);
            var userService = new UserService(userRepository, Context, userServiceLogger);
            var tokenService = new TokenService(configuration);
            
            return new DatabaseAuthService(userService, tokenService, authLogger);
        }

        #region Registration Tests

        [Fact]
        public async Task Register_ValidRequest_Success()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "newuser",
                Password = "Password123!",
                Name = "New User",
                Email = "newuser@example.com",
                Phone = "555-1111",
                AcceptedTerms = true
            };

            // Act
            var response = await authService.RegisterAsync(registerRequest);

            // Assert
            response.Should().NotBeNull();
            response.Username.Should().Be("newuser");
            response.Email.Should().Be("newuser@example.com");
            response.AccessToken.Should().NotBeNullOrEmpty();
            response.Role.Should().Be("user");
        }

        [Fact]
        public async Task Register_DuplicateUsername_ThrowsInvalidOperationException()
        {
            // Arrange
            var authService = GetAuthService();
            var request1 = new RegisterRequest
            {
                Username = "duplicate",
                Password = "Password123!",
                Name = "User 1",
                Email = "user1@example.com",
                Phone = "555-2222",
                AcceptedTerms = true
            };
            var request2 = new RegisterRequest
            {
                Username = "duplicate",
                Password = "Password123!",
                Name = "User 2",
                Email = "user2@example.com",
                Phone = "555-3333",
                AcceptedTerms = true
            };

            // Act
            await authService.RegisterAsync(request1);

            // Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await authService.RegisterAsync(request2));
        }

        [Fact]
        public async Task Register_DuplicateEmail_ThrowsInvalidOperationException()
        {
            // Arrange
            var authService = GetAuthService();
            var request1 = new RegisterRequest
            {
                Username = "user1",
                Password = "Password123!",
                Name = "User 1",
                Email = "duplicate@example.com",
                Phone = "555-4444",
                AcceptedTerms = true
            };
            var request2 = new RegisterRequest
            {
                Username = "user2",
                Password = "Password123!",
                Name = "User 2",
                Email = "duplicate@example.com",
                Phone = "555-5555",
                AcceptedTerms = true
            };

            // Act
            await authService.RegisterAsync(request1);

            // Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await authService.RegisterAsync(request2));
        }

        [Fact]
        public async Task Register_EmptyUsername_ThrowsArgumentException()
        {
            // Arrange
            var authService = GetAuthService();
            var request = new RegisterRequest
            {
                Username = "",
                Password = "Password123!",
                Name = "Test",
                Email = "test@example.com",
                Phone = "555-6666",
                AcceptedTerms = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await authService.RegisterAsync(request));
        }

        [Fact]
        public async Task Register_EmptyPassword_ThrowsArgumentException()
        {
            // Arrange
            var authService = GetAuthService();
            var request = new RegisterRequest
            {
                Username = "testuser",
                Password = "",
                Name = "Test",
                Email = "test@example.com",
                Phone = "555-7777",
                AcceptedTerms = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await authService.RegisterAsync(request));
        }

        [Fact]
        public async Task Register_ShortPassword_ThrowsArgumentException()
        {
            // Arrange
            var authService = GetAuthService();
            var request = new RegisterRequest
            {
                Username = "testuser",
                Password = "short",
                Name = "Test",
                Email = "test@example.com",
                Phone = "555-8888",
                AcceptedTerms = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await authService.RegisterAsync(request));
        }

        [Fact]
        public async Task Register_EmptyName_ThrowsArgumentException()
        {
            // Arrange
            var authService = GetAuthService();
            var request = new RegisterRequest
            {
                Username = "testuser",
                Password = "Password123!",
                Name = "",
                Email = "test@example.com",
                Phone = "555-9999",
                AcceptedTerms = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(async () =>
                await authService.RegisterAsync(request));
        }

        #endregion

        #region Login Tests

        [Fact]
        public async Task Login_WithUsername_Success()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "loginuser",
                Password = "Password123!",
                Name = "Login User",
                Email = "login@example.com",
                Phone = "555-0001",
                AcceptedTerms = true
            };
            await authService.RegisterAsync(registerRequest);

            // Act
            var loginResponse = await authService.LoginAsync("loginuser", "Password123!");

            // Assert
            loginResponse.Should().NotBeNull();
            loginResponse.Username.Should().Be("loginuser");
            loginResponse.AccessToken.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task Login_WithEmail_Success()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "emaillogin",
                Password = "Password123!",
                Name = "Email Login",
                Email = "emaillogin@example.com",
                Phone = "555-0002",
                AcceptedTerms = true
            };
            await authService.RegisterAsync(registerRequest);

            // Act
            var loginResponse = await authService.LoginAsync("emaillogin@example.com", "Password123!");

            // Assert
            loginResponse.Should().NotBeNull();
            loginResponse.Username.Should().Be("emaillogin");
            loginResponse.Email.Should().Be("emaillogin@example.com");
        }

        [Fact]
        public async Task Login_InvalidUsername_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var authService = GetAuthService();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await authService.LoginAsync("nonexistent", "Password123!"));
        }

        [Fact]
        public async Task Login_InvalidPassword_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "wrongpass",
                Password = "CorrectPassword123!",
                Name = "Wrong Pass",
                Email = "wrongpass@example.com",
                Phone = "555-0003"
            };
            await authService.RegisterAsync(registerRequest);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await authService.LoginAsync("wrongpass", "WrongPassword!"));
        }

        [Fact]
        public async Task Login_InactiveUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "inactive",
                Password = "Password123!",
                Name = "Inactive User",
                Email = "inactive@example.com",
                Phone = "555-0004",
                AcceptedTerms = true
            };
            var response = await authService.RegisterAsync(registerRequest);

            // Deactivate user
            var user = await Context.Users.FindAsync(response.UserId);
            user!.IsActive = false;
            await Context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await authService.LoginAsync("inactive", "Password123!"));
        }

        #endregion

        #region User Profile Tests

        [Fact]
        public async Task GetUserProfile_ValidUserId_ReturnsProfile()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "profileuser",
                Password = "Password123!",
                Name = "Profile User",
                Email = "profile@example.com",
                Phone = "555-0005",
                AcceptedTerms = true
            };
            var registerResponse = await authService.RegisterAsync(registerRequest);

            // Act
            var profile = await authService.GetUserProfileAsync(registerResponse.UserId);

            // Assert
            profile.Should().NotBeNull();
            profile!.Username.Should().Be("profileuser");
            profile.Email.Should().Be("profile@example.com");
            profile.Name.Should().Be("Profile User");
        }

        [Fact]
        public async Task GetUserProfile_InvalidUserId_ReturnsNull()
        {
            // Arrange
            var authService = GetAuthService();

            // Act
            var profile = await authService.GetUserProfileAsync(99999);

            // Assert
            profile.Should().BeNull();
        }

        [Fact]
        public async Task UpdateUserProfile_ValidData_UpdatesSuccessfully()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "updateuser",
                Password = "Password123!",
                Name = "Old Name",
                Email = "old@example.com",
                Phone = "555-0006",
                AcceptedTerms = true
            };
            var registerResponse = await authService.RegisterAsync(registerRequest);

            // Act
            var updatedProfile = await authService.UpdateUserProfileAsync(
                registerResponse.UserId,
                "New Name",
                "new@example.com",
                "555-9999",
                "New Location",
                "123 New St",
                "New City",
                "NY",
                "12345",
                "USA",
                null);

            // Assert
            updatedProfile.Should().NotBeNull();
            updatedProfile!.Name.Should().Be("New Name");
            updatedProfile.Email.Should().Be("new@example.com");
            updatedProfile.Phone.Should().Be("555-9999");
            updatedProfile.Location.Should().Be("New Location");
        }

        [Fact]
        public async Task UpdateUserProfile_InvalidUserId_ReturnsNull()
        {
            // Arrange
            var authService = GetAuthService();

            // Act
            var result = await authService.UpdateUserProfileAsync(
                99999,
                "Name",
                "email@example.com",
                "555-0000",
                "",
                "",
                "",
                "",
                "",
                "",
                null);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task UpdateUserProfile_DuplicateEmail_ThrowsInvalidOperationException()
        {
            // Arrange
            var authService = GetAuthService();
            
            // Create first user
            var request1 = new RegisterRequest
            {
                Username = "user1update",
                Password = "Password123!",
                Name = "User 1",
                Email = "existing@example.com",
                Phone = "555-0007",
                AcceptedTerms = true
            };
            await authService.RegisterAsync(request1);

            // Create second user
            var request2 = new RegisterRequest
            {
                Username = "user2update",
                Password = "Password123!",
                Name = "User 2",
                Email = "user2@example.com",
                Phone = "555-0008",
                AcceptedTerms = true
            };
            var response2 = await authService.RegisterAsync(request2);

            // Act & Assert - Try to update user2's email to user1's email
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await authService.UpdateUserProfileAsync(
                    response2.UserId,
                    "User 2",
                    "existing@example.com",  // Duplicate email
                    "555-0008",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    null));
        }

        #endregion

        #region User Exists Tests

        [Fact]
        public async Task UserExists_ValidUserId_ReturnsTrue()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "existsuser",
                Password = "Password123!",
                Name = "Exists User",
                Email = "exists@example.com",
                Phone = "555-0009"
            };
            var response = await authService.RegisterAsync(registerRequest);

            // Act
            var exists = await authService.UserExistsAsync(response.UserId);

            // Assert
            exists.Should().BeTrue();
        }

        [Fact]
        public async Task UserExists_InvalidUserId_ReturnsFalse()
        {
            // Arrange
            var authService = GetAuthService();

            // Act
            var exists = await authService.UserExistsAsync(99999);

            // Assert
            exists.Should().BeFalse();
        }

        #endregion

        #region Full Flow Tests

        [Fact]
        public async Task FullFlow_RegisterLoginGetProfileUpdate_AllStepsWork()
        {
            // Arrange
            var authService = GetAuthService();
            var registerRequest = new RegisterRequest
            {
                Username = "fullflowuser",
                Password = "Password123!",
                Name = "Full Flow User",
                Email = "fullflow@example.com",
                Phone = "555-0010",
                AcceptedTerms = true
            };

            // Act & Assert - Register
            var registerResponse = await authService.RegisterAsync(registerRequest);
            registerResponse.Should().NotBeNull();
            registerResponse.AccessToken.Should().NotBeNullOrEmpty();

            // Act & Assert - Login
            var loginResponse = await authService.LoginAsync("fullflowuser", "Password123!");
            loginResponse.Should().NotBeNull();
            loginResponse.UserId.Should().Be(registerResponse.UserId);

            // Act & Assert - Get Profile
            var profile = await authService.GetUserProfileAsync(registerResponse.UserId);
            profile.Should().NotBeNull();
            profile!.Username.Should().Be("fullflowuser");

            // Act & Assert - Update Profile
            var updatedProfile = await authService.UpdateUserProfileAsync(
                registerResponse.UserId,
                "Updated Name",
                "updated@example.com",
                "555-9999",
                "",
                "",
                "",
                "",
                "",
                "",
                null);
            updatedProfile.Should().NotBeNull();
            updatedProfile!.Name.Should().Be("Updated Name");
            updatedProfile.Email.Should().Be("updated@example.com");
        }

        #endregion
    }
}

