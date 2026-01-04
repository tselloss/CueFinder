using CueFinder.Auth.Services;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Xunit;

namespace CueFinder.Auth.Tests.Services
{
    public class TokenServiceTests
    {
        private readonly IConfiguration _configuration;
        private readonly TokenService _tokenService;

        public TokenServiceTests()
        {
            // Setup test configuration
            var configurationBuilder = new ConfigurationBuilder();
            var configData = new Dictionary<string, string>
            {
                {"JwtSettings:SecretKey", "ThisIsAVerySecureSecretKeyForTestingPurposesOnly123456789"},
                {"JwtSettings:Issuer", "CueFinderTestIssuer"},
                {"JwtSettings:Audience", "CueFinderTestAudience"},
                {"JwtSettings:ExpirationMinutes", "60"}
            };
            configurationBuilder.AddInMemoryCollection(configData!);
            _configuration = configurationBuilder.Build();

            _tokenService = new TokenService(_configuration);
        }

        [Fact]
        public void GenerateToken_WithValidInputs_ReturnsValidJwtToken()
        {
            // Arrange
            int userId = 1;
            string username = "testuser";
            string role = "user";

            // Act
            var token = _tokenService.GenerateToken(userId, username, role);

            // Assert
            token.Should().NotBeNullOrEmpty();
            
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            jwtToken.Should().NotBeNull();
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == userId.ToString());
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == username);
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == role);
        }

        [Fact]
        public void GenerateToken_WithAdminRole_ReturnsTokenWithAdminRole()
        {
            // Arrange
            int userId = 1;
            string username = "admin";
            string role = "admin";

            // Act
            var token = _tokenService.GenerateToken(userId, username, role);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == "admin");
        }

        [Fact]
        public void GenerateToken_ChecksIssuerAndAudience()
        {
            // Arrange
            int userId = 1;
            string username = "testuser";
            string role = "user";

            // Act
            var token = _tokenService.GenerateToken(userId, username, role);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            jwtToken.Issuer.Should().Be("CueFinderTestIssuer");
            jwtToken.Audiences.Should().Contain("CueFinderTestAudience");
        }

        [Fact]
        public void GenerateToken_ChecksExpiration()
        {
            // Arrange
            int userId = 1;
            string username = "testuser";
            string role = "user";

            // Act
            var token = _tokenService.GenerateToken(userId, username, role);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            var expectedExpiration = DateTime.UtcNow.AddMinutes(60);
            jwtToken.ValidTo.Should().BeCloseTo(expectedExpiration, TimeSpan.FromMinutes(1));
        }

        [Fact]
        public void GetTokenExpirationSeconds_ReturnsCorrectValue()
        {
            // Act
            var expirationSeconds = _tokenService.GetTokenExpirationSeconds();

            // Assert
            expirationSeconds.Should().Be(3600); // 60 minutes * 60 seconds
        }

        [Theory]
        [InlineData(1, "user1", "user")]
        [InlineData(100, "user100", "admin")]
        [InlineData(999, "specialUser", "moderator")]
        public void GenerateToken_WithDifferentUsers_GeneratesDifferentTokens(int userId, string username, string role)
        {
            // Act
            var token = _tokenService.GenerateToken(userId, username, role);

            // Assert
            token.Should().NotBeNullOrEmpty();
            
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(token);
            
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == userId.ToString());
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == username);
            jwtToken.Claims.Should().Contain(c => c.Type == ClaimTypes.Role && c.Value == role);
        }
    }
}
