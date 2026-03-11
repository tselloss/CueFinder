using CueFinder.Extensions.Controllers;
using CueFinder.Extensions.Images;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using FluentAssertions;
using Xunit;

namespace CueFinder.Extensions.Tests.Controllers
{
    /// <summary>
    /// Tests for ImagesController claim extraction (GetUserIdFromClaims).
    /// Verifies that the same 3-claim fallback chain used in BaseApiController
    /// works correctly for .NET 8 JsonWebTokenHandler compatibility.
    /// </summary>
    public class ImagesControllerTests
    {
        private readonly Mock<IImageService> _imageService;
        private readonly Mock<ILogger<ImagesController>> _logger;

        public ImagesControllerTests()
        {
            _imageService = new Mock<IImageService>();
            _logger = new Mock<ILogger<ImagesController>>();
        }

        private ImagesController CreateController(ClaimsPrincipal user)
        {
            var controller = new ImagesController(_imageService.Object, _logger.Object);
            controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = user }
            };
            return controller;
        }

        private ClaimsPrincipal UserWithClaim(string claimType, string value) =>
            new ClaimsPrincipal(new ClaimsIdentity(new[] { new Claim(claimType, value) }, "test"));

        // ── nameid (short form written by JwtSecurityTokenHandler) ──────────

        [Fact]
        public async Task UploadMultiple_WithNameidClaim_ResolvesUserId()
        {
            // This is the .NET 8 scenario: JwtSecurityTokenHandler writes ClaimTypes.NameIdentifier
            // as "nameid" in the JWT; JsonWebTokenHandler does not map it back to the full URI.
            var user = UserWithClaim("nameid", "42");

            _imageService
                .Setup(s => s.UploadMultipleImagesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<int>(), 42))
                .ReturnsAsync(new List<ImageUploadResponse> { new ImageUploadResponse { Success = true } });

            var controller = CreateController(user);
            var files = new List<IFormFile> { CreateFakeFile() };

            var result = await controller.UploadMultipleImages(1, files);

            result.Should().BeOfType<OkObjectResult>();
        }

        // ── ClaimTypes.NameIdentifier (full URI form) ────────────────────────

        [Fact]
        public async Task UploadMultiple_WithNameIdentifierClaim_ResolvesUserId()
        {
            var user = UserWithClaim(ClaimTypes.NameIdentifier, "42");

            _imageService
                .Setup(s => s.UploadMultipleImagesAsync(It.IsAny<List<IFormFile>>(), It.IsAny<int>(), 42))
                .ReturnsAsync(new List<ImageUploadResponse> { new ImageUploadResponse { Success = true } });

            var controller = CreateController(user);
            var files = new List<IFormFile> { CreateFakeFile() };

            var result = await controller.UploadMultipleImages(1, files);

            result.Should().BeOfType<OkObjectResult>();
        }

        // ── sub claim (present but contains email, not userId) ───────────────

        [Fact]
        public async Task UploadMultiple_WithSubAsEmailOnly_ReturnsUnauthorized()
        {
            // "sub" = email (not a user ID) and no "nameid" present → cannot resolve userId
            var user = UserWithClaim("sub", "user@example.com");

            var controller = CreateController(user);
            var files = new List<IFormFile> { CreateFakeFile() };

            var result = await controller.UploadMultipleImages(1, files);

            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        // ── No claims ────────────────────────────────────────────────────────

        [Fact]
        public async Task UploadMultiple_WithNoClaims_ReturnsUnauthorized()
        {
            var user = new ClaimsPrincipal(new ClaimsIdentity());

            var controller = CreateController(user);
            var files = new List<IFormFile> { CreateFakeFile() };

            var result = await controller.UploadMultipleImages(1, files);

            result.Should().BeOfType<UnauthorizedObjectResult>();
        }

        // ── No files ─────────────────────────────────────────────────────────

        [Fact]
        public async Task UploadMultiple_WithValidUserButNoFiles_ReturnsBadRequest()
        {
            var user = UserWithClaim("nameid", "42");
            var controller = CreateController(user);

            var result = await controller.UploadMultipleImages(1, new List<IFormFile>());

            result.Should().BeOfType<BadRequestObjectResult>();
        }

        private static IFormFile CreateFakeFile()
        {
            var stream = new MemoryStream(new byte[] { 1, 2, 3 });
            return new FormFile(stream, 0, stream.Length, "files", "test.jpg")
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg"
            };
        }
    }
}
