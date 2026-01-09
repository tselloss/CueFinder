using CueFinder.Auth.Models;
using CueFinder.Auth.Services;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using CueFinder.Database.IntegrationTests.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Xunit;

namespace CueFinder.Auth.IntegrationTests
{
    /// <summary>
    /// Integration tests for authentication using real PostgreSQL database from Docker
    /// </summary>
    public class DatabaseAuthServiceIntegrationTests : DatabaseTestBase
    {
        private DatabaseAuthService? _authService;
        private TokenService? _tokenService;
        private UserService? _userService;

        public DatabaseAuthServiceIntegrationTests() : base()
        {
            // Defer initialization to test methods
        }

        private void EnsureInit()
        {
            if (_authService != null) return; // Already initialized
            
            // Database is already initialized by DatabaseTestBase constructor
            
            // Setup configuration for TokenService
            var configurationBuilder = new ConfigurationBuilder();
            var configData = new Dictionary<string, string>
            {
                {"JwtSettings:SecretKey", "ThisIsAVerySecureSecretKeyForTestingPurposesOnly123456789"},
                {"JwtSettings:Issuer", "CueFinderTestIssuer"},
                {"JwtSettings:Audience", "CueFinderTestAudience"},
                {"JwtSettings:ExpirationMinutes", "60"}
            };
            configurationBuilder.AddInMemoryCollection(configData!);
            var configuration = configurationBuilder.Build();

            // Setup services
            var userLogger = new TestLogger<UserService>();
            var userRepoLogger = new TestLogger<UserRepository>();
            var authLogger = new TestLogger<DatabaseAuthService>();

            var userRepository = new UserRepository(Context, userRepoLogger);
            _userService = new UserService(userRepository, Context, userLogger);
            _tokenService = new TokenService(configuration);
            _authService = new DatabaseAuthService(_userService, _tokenService, authLogger);
        }
        
        private DatabaseAuthService AuthService => _authService ?? throw new InvalidOperationException("Not initialized");
        private UserService UserService => _userService ?? throw new InvalidOperationException("Not initialized");
        private TokenService TokenService => _tokenService ?? throw new InvalidOperationException("Not initialized");

        [Fact]
        public async Task FullAuthenticationFlow_RegisterLoginAndProfile_WorksCorrectly()
        {
            EnsureInit();
            // Step 1: Register a new user
            var registerRequest = new RegisterRequest
            {
                Username = "integrationtest",
                Password = "Password123!",
                Name = "Integration Test User",
                Email = "integration@test.com",
                Phone = "555-9999"
            };

            var registerResponse = await _authService.RegisterAsync(registerRequest);

            // Assert registration
            registerResponse.Should().NotBeNull();
            registerResponse.Username.Should().Be("integrationtest");
            registerResponse.Name.Should().Be("Integration Test User");
            registerResponse.Email.Should().Be("integration@test.com");
            registerResponse.AccessToken.Should().NotBeNullOrEmpty();
            registerResponse.Role.Should().Be("user");

            // Verify user exists in database
            var userInDb = await _userService.GetByUsernameAsync("integrationtest");
            userInDb.Should().NotBeNull();
            userInDb!.Name.Should().Be("Integration Test User");

            // Step 2: Login with username
            var loginResponse = await _authService.LoginAsync("integrationtest", "Password123!");

            // Assert login
            loginResponse.Should().NotBeNull();
            loginResponse.AccessToken.Should().NotBeNullOrEmpty();
            loginResponse.Username.Should().Be("integrationtest");
            loginResponse.UserId.Should().BeGreaterThan(0);

            // Step 3: Get profile
            var profile = await _authService.GetUserProfileAsync(loginResponse.UserId);

            // Assert profile
            profile.Should().NotBeNull();
            profile!.Username.Should().Be("integrationtest");
            profile.Name.Should().Be("Integration Test User");
            profile.Email.Should().Be("integration@test.com");

            // Step 4: Update profile
            var updatedProfile = await _authService.UpdateUserProfileAsync(
                loginResponse.UserId,
                "Updated Integration User",
                "updated@test.com",
                "555-0000",
                "Test Location",
                "123 Test St",
                "Test City",
                "Test State",
                "12345",
                "Test Country");

            // Assert update
            updatedProfile.Should().NotBeNull();
            updatedProfile!.Name.Should().Be("Updated Integration User");
            updatedProfile.Email.Should().Be("updated@test.com");
            updatedProfile.Phone.Should().Be("555-0000");

            // Verify update persisted in database
            var updatedUserInDb = await _userService.GetByUsernameAsync("integrationtest");
            updatedUserInDb!.Name.Should().Be("Updated Integration User");
            updatedUserInDb.Email.Should().Be("updated@test.com");
        }

        [Fact]
        public async Task RegisterAsync_WithDuplicateUsername_ThrowsException()
        {
            EnsureInit();
            // Arrange
            var request1 = new RegisterRequest
            {
                Username = "duplicate",
                Password = "Password123!",
                Name = "User 1"
            };

            await _authService.RegisterAsync(request1);

            var request2 = new RegisterRequest
            {
                Username = "duplicate",
                Password = "Password456!",
                Name = "User 2"
            };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.RegisterAsync(request2));

            // Verify only one user exists
            var usersInDb = await Context.Users.Where(u => u.Username == "duplicate").ToListAsync();
            usersInDb.Should().HaveCount(1);
        }

        [Fact]
        public async Task LoginAsync_WithEmail_WorksCorrectly()
        {
            EnsureInit();
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "emailuser",
                Password = "Password123!",
                Name = "Email User",
                Email = "emailtest@test.com"
            };

            await _authService.RegisterAsync(registerRequest);

            // Act - Login with email instead of username
            var loginResponse = await _authService.LoginAsync("emailtest@test.com", "Password123!");

            // Assert
            loginResponse.Should().NotBeNull();
            loginResponse.Email.Should().Be("emailtest@test.com");
            loginResponse.Username.Should().Be("emailuser");
        }

        [Fact]
        public async Task LoginAsync_UpdatesLastLoginTimestamp()
        {
            EnsureInit();
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "timestamptest",
                Password = "Password123!",
                Name = "Timestamp Test"
            };

            var registerResponse = await _authService.RegisterAsync(registerRequest);
            var userId = registerResponse.UserId;

            var userBefore = await _userService.GetUserWithDetailsAsync(userId);
            var initialLastLogin = userBefore!.LastLoginAt;

            await Task.Delay(100); // Ensure time difference

            // Act
            await _authService.LoginAsync("timestamptest", "Password123!");

            // Assert
            var userAfter = await _userService.GetUserWithDetailsAsync(userId);
            userAfter!.LastLoginAt.Should().BeAfter(initialLastLogin ?? DateTime.MinValue);
        }

        [Fact]
        public async Task LoginAsync_WithInactiveUser_ThrowsException()
        {
            EnsureInit();
            // Arrange
            var registerRequest = new RegisterRequest
            {
                Username = "inactiveuser",
                Password = "Password123!",
                Name = "Inactive User"
            };

            var registerResponse = await _authService.RegisterAsync(registerRequest);

            // Deactivate user
            var user = await _userService.GetUserWithDetailsAsync(registerResponse.UserId);
            user!.IsActive = false;
            await _userService.UpdateUserAsync(user);

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _authService.LoginAsync("inactiveuser", "Password123!"));
        }

        [Fact]
        public async Task UpdateUserProfileAsync_WithExistingEmail_ThrowsException()
        {
            EnsureInit();
            // Arrange - Create two users
            var user1Request = new RegisterRequest
            {
                Username = "user1",
                Password = "Password123!",
                Name = "User 1",
                Email = "user1@test.com"
            };

            var user2Request = new RegisterRequest
            {
                Username = "user2",
                Password = "Password123!",
                Name = "User 2",
                Email = "user2@test.com"
            };

            await _authService.RegisterAsync(user1Request);
            var user2Response = await _authService.RegisterAsync(user2Request);

            // Act - Try to update user2's email to user1's email
            // Assert
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _authService.UpdateUserProfileAsync(
                    user2Response.UserId,
                    "",
                    "user1@test.com",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    ""));
        }

        [Fact]
        public async Task RegisterAsync_CreatesUserInDatabase()
        {
            EnsureInit();
            // Arrange
            var request = new RegisterRequest
            {
                Username = "dbtest",
                Password = "Password123!",
                Name = "Database Test"
            };

            // Act
            var response = await _authService.RegisterAsync(request);

            // Assert - Verify user exists in database
            var userInDb = await Context.Users.FirstOrDefaultAsync(u => u.Username == "dbtest");
            userInDb.Should().NotBeNull();
            userInDb!.Name.Should().Be("Database Test");
            userInDb.Role.Should().Be("user");
            userInDb.IsActive.Should().BeTrue();
            userInDb.PasswordHash.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task PasswordHashing_WorksCorrectly()
        {
            EnsureInit();
            // Arrange
            var request = new RegisterRequest
            {
                Username = "hashtest",
                Password = "MySecurePassword123!",
                Name = "Hash Test"
            };

            // Act
            await _authService.RegisterAsync(request);

            // Assert - Password should be hashed, not stored as plain text
            var userInDb = await Context.Users.FirstOrDefaultAsync(u => u.Username == "hashtest");
            userInDb!.PasswordHash.Should().NotBe("MySecurePassword123!");
            userInDb.PasswordHash.Should().NotBeNullOrEmpty();

            // Should still be able to login with original password
            var loginResult = await _authService.LoginAsync("hashtest", "MySecurePassword123!");
            loginResult.Should().NotBeNull();
        }

        // Simple test logger implementation
        private class TestLogger<T> : ILogger<T>
        {
            public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
            public bool IsEnabled(LogLevel logLevel) => false;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter) { }
        }
    }
}
