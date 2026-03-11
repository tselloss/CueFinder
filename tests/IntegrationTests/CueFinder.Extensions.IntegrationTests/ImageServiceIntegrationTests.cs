using CueFinder.Extensions.Images;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace CueFinder.Extensions.IntegrationTests
{
    public class ImageServiceIntegrationTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<ImageService>> _logger;
        private readonly Mock<IOptions<ImageStorageSettings>> _options;
        private readonly Mock<IWebHostEnvironment> _webHostEnvironment;
        private readonly ImageService _service;
        private readonly string _testUploadPath;
        private readonly string _testMiscPath;

        public ImageServiceIntegrationTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new CueFinderDbContext(options);
            
            _logger = new Mock<ILogger<ImageService>>();
            _options = new Mock<IOptions<ImageStorageSettings>>();
            _webHostEnvironment = new Mock<IWebHostEnvironment>();
            
            _testUploadPath = Path.Combine(Path.GetTempPath(), "cuefinder-integration-test-uploads");
            _testMiscPath = Path.Combine(_testUploadPath, "misc");
            
            // Clean up any existing test directories
            if (Directory.Exists(_testUploadPath))
            {
                Directory.Delete(_testUploadPath, true);
            }

            var settings = new ImageStorageSettings
            {
                StoragePath = _testUploadPath,
                ImageUrlBase = "https://test.com/uploads",
                MaxFileSizeBytes = 10 * 1024 * 1024, // 10MB
                AllowedExtensions = ".jpg,.jpeg,.png,.gif,.webp",
                AllowedMimeTypes = "image/jpeg,image/png,image/gif,image/webp"
            };

            _options.Setup(x => x.Value).Returns(settings);
            _webHostEnvironment.Setup(x => x.WebRootPath).Returns(_testUploadPath);

            _service = new ImageService(_context, _logger.Object, _options.Object, _webHostEnvironment.Object);
        }

        [Fact]
        public async Task UploadImageAsync_Integration_FullWorkflow()
        {
            // Arrange - Create test user and cue
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("integration-test.jpg", "image/jpeg");

            // Act
            var result = await _service.UploadImageAsync(cue.Id, imageFile, user.Id);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ImageUrl.Should().NotBeNullOrEmpty();
            result.ImageId.Should().BeGreaterThan(0);

            // Verify database record
            var imageInDb = await _context.CueImages.FirstOrDefaultAsync();
            imageInDb.Should().NotBeNull();
            imageInDb.CueId.Should().Be(cue.Id);
            imageInDb.ImageUrl.Should().Contain("/uploads/cues/");
            imageInDb.IsPrimary.Should().BeFalse();

            // Verify physical file exists
            var fileName = Path.GetFileName(imageInDb.ImageUrl);
            var filePath = Path.Combine(_testUploadPath, cue.Id.ToString(), fileName);
            File.Exists(filePath).Should().BeTrue();

            // Verify file content
            var fileContent = File.ReadAllText(filePath);
            fileContent.Should().Be("fake image content");
        }

        [Fact]
        public async Task UploadMultipleImagesAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                CreateTestImageFile("multi1.jpg", "image/jpeg"),
                CreateTestImageFile("multi2.png", "image/png"),
                CreateTestImageFile("multi3.gif", "image/gif")
            };

            // Act
            var results = await _service.UploadMultipleImagesAsync(images, cue.Id, user.Id);

            // Assert
            results.Should().HaveCount(3);
            results.All(r => r.Success).Should().BeTrue();
            results.All(r => r.ImageId > 0).Should().BeTrue();

            // Verify database records
            var imagesInDb = await _context.CueImages.ToListAsync();
            imagesInDb.Should().HaveCount(3);
            imagesInDb.All(i => i.CueId == cue.Id).Should().BeTrue();

            // Verify physical files
            foreach (var image in imagesInDb)
            {
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(_testUploadPath, cue.Id.ToString(), fileName);
                File.Exists(filePath).Should().BeTrue();
            }
        }

        [Fact]
        public async Task UploadStandaloneAsync_Integration()
        {
            // Arrange
            var imageFile = CreateTestImageFile("standalone-integration.jpg", "image/jpeg");

            // Act
            var result = await _service.UploadStandaloneAsync(imageFile);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ImageUrl.Should().Contain("/uploads/misc/");
            result.FileSize.Should().BeGreaterThan(0);

            // Verify physical file exists in misc folder
            var fileName = Path.GetFileName(result.ImageUrl);
            var filePath = Path.Combine(_testMiscPath, fileName);
            File.Exists(filePath).Should().BeTrue();
        }

        [Fact]
        public async Task GetCueImagesAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            // Create test images in database
            var images = new[]
            {
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/1.jpg", DisplayOrder = 2, IsPrimary = false, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/2.jpg", DisplayOrder = 1, IsPrimary = true, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/3.jpg", DisplayOrder = 0, IsPrimary = false, UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Create physical files
            foreach (var image in images)
            {
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(_testUploadPath, cue.Id.ToString(), fileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                File.WriteAllText(filePath, "test content");
            }

            // Act
            var result = await _service.GetCueImagesAsync(cue.Id);

            // Assert
            result.Should().HaveCount(3);
            result[0].IsPrimary.Should().BeTrue(); // Primary image first
            result[1].DisplayOrder.Should().Be(0); // Then by display order
            result[2].DisplayOrder.Should().Be(2);
        }

        [Fact]
        public async Task DeleteImageAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cue.Id,
                ImageUrl = "/uploads/cues/integration-test.jpg",
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Create physical file
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(_testUploadPath, cue.Id.ToString(), fileName);
            Directory.CreateDirectory(Path.GetDirectoryName(filePath));
            File.WriteAllText(filePath, "test content");

            // Act
            var result = await _service.DeleteImageAsync(image.Id, user.Id);

            // Assert
            result.Should().BeTrue();

            // Verify database record deleted
            var imageInDb = await _context.CueImages.FindAsync(image.Id);
            imageInDb.Should().BeNull();

            // Verify physical file deleted
            File.Exists(filePath).Should().BeFalse();
        }

        [Fact]
        public async Task DeleteCueImagesInternalAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/1.jpg", UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/2.jpg", UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Create physical files
            foreach (var image in images)
            {
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(_testUploadPath, cue.Id.ToString(), fileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                File.WriteAllText(filePath, "test content");
            }

            // Act
            await _service.DeleteCueImagesInternalAsync(cue.Id);

            // Assert
            var remainingImages = await _context.CueImages.Where(i => i.CueId == cue.Id).ToListAsync();
            remainingImages.Should().HaveCount(0);

            // Verify physical files deleted
            var cueFolder = Path.Combine(_testUploadPath, cue.Id.ToString());
            Directory.Exists(cueFolder).Should().BeFalse();
        }

        [Fact]
        public async Task SetPrimaryImageAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/1.jpg", IsPrimary = true, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cue.Id, ImageUrl = "/uploads/cues/2.jpg", IsPrimary = false, UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SetPrimaryImageAsync(images[1].Id, user.Id);

            // Assert
            result.Should().BeTrue();

            // Verify other primary image was unset
            var firstImage = await _context.CueImages.FindAsync(images[0].Id);
            firstImage.IsPrimary.Should().BeFalse();

            // Verify new image is primary
            var secondImage = await _context.CueImages.FindAsync(images[1].Id);
            secondImage.IsPrimary.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateImageOrderAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cue.Id,
                ImageUrl = "/uploads/cues/test.jpg",
                DisplayOrder = 5,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.UpdateImageOrderAsync(image.Id, 10, user.Id);

            // Assert
            result.Should().BeTrue();

            var updatedImage = await _context.CueImages.FindAsync(image.Id);
            updatedImage.DisplayOrder.Should().Be(10);
        }

        [Fact]
        public async Task EnsureStorageRootExists_Integration()
        {
            // Arrange
            var newService = new ImageService(_context, _logger.Object, _options.Object, _webHostEnvironment.Object);

            // Act
            newService.EnsureStorageRootExists();

            // Assert
            Directory.Exists(_testUploadPath).Should().BeTrue();
        }

        [Fact]
        public async Task UploadImageAsync_WithModerationService_Integration()
        {
            // This test would require setting up the moderation service
            // For now, we'll test the basic upload functionality
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("moderation-test.jpg", "image/jpeg");

            // Act
            var result = await _service.UploadImageAsync(cue.Id, imageFile, user.Id);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ImageUrl.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task GetImageByIdAsync_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cue.Id,
                ImageUrl = "/uploads/cues/test.jpg",
                AltText = "Test image",
                DisplayOrder = 1,
                IsPrimary = true,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetImageByIdAsync(image.Id);

            // Assert
            result.Should().NotBeNull();
            result.CueId.Should().Be(cue.Id);
            result.ImageUrl.Should().Be("/uploads/cues/test.jpg");
            result.AltText.Should().Be("Test image");
            result.IsPrimary.Should().BeTrue();
        }

        [Fact]
        public async Task UploadImageAsync_InvalidUser_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var wrongUserId = 999;
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test.jpg", "image/jpeg");

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.UploadImageAsync(cue.Id, imageFile, wrongUserId));
        }

        [Fact]
        public async Task UploadImageAsync_InvalidFile_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test.exe", "application/octet-stream");

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _service.UploadImageAsync(cue.Id, imageFile, user.Id));
        }

        [Fact]
        public async Task UploadImageAsync_SetAsPrimary_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            // Create existing primary image
            var existingImage = new CueImage
            {
                CueId = cue.Id,
                ImageUrl = "/uploads/cues/test1.jpg",
                IsPrimary = true,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(existingImage);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test2.jpg", "image/jpeg");

            // Act
            var result = await _service.UploadImageAsync(cue.Id, imageFile, user.Id, isPrimary: true);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.IsPrimary.Should().BeTrue();

            // Verify other primary image was unset
            var existingImageAfter = await _context.CueImages.FindAsync(existingImage.Id);
            existingImageAfter.IsPrimary.Should().BeFalse();

            // Verify new image is primary
            var newImage = await _context.CueImages.FindAsync(result.ImageId);
            newImage.IsPrimary.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteImageAsync_WrongUser_Integration()
        {
            // Arrange
            var user = new User { Id = 1, Username = "testuser", IsActive = true };
            var wrongUserId = 999;
            var cue = new Cue { Id = 1, Title = "Test Cue", UserId = 1 };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cue.Id,
                ImageUrl = "/uploads/cues/test.jpg",
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                _service.DeleteImageAsync(image.Id, wrongUserId));
        }

        private IFormFile CreateTestImageFile(string fileName, string contentType)
        {
            var stream = new MemoryStream();
            var writer = new StreamWriter(stream);
            writer.Write("fake image content");
            writer.Flush();
            stream.Position = 0;

            return new FormFile(stream, 0, stream.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
            
            if (Directory.Exists(_testUploadPath))
            {
                Directory.Delete(_testUploadPath, true);
            }
        }
    }
}