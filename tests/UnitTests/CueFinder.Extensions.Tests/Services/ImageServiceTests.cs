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
using FluentAssertions;
using CueFinder.Extensions.Moderation;

namespace CueFinder.Extensions.Tests.Services
{
    public class ImageServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<ImageService>> _logger;
        private readonly Mock<IOptions<ImageStorageSettings>> _options;
        private readonly Mock<IWebHostEnvironment> _webHostEnvironment;
        private readonly Mock<IModerationService> _moderationService;
        private readonly ImageService _service;
        private readonly string _testUploadPath;

        public ImageServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new CueFinderDbContext(options);
            
            _logger = new Mock<ILogger<ImageService>>();
            _options = new Mock<IOptions<ImageStorageSettings>>();
            _webHostEnvironment = new Mock<IWebHostEnvironment>();
            _moderationService = new Mock<IModerationService>();
            
            _testUploadPath = Path.Combine(Path.GetTempPath(), "cuefinder-test-uploads");
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
            _moderationService
                .Setup(m => m.ScanImageAsync(It.IsAny<string>(), It.IsAny<int>(), It.IsAny<int?>(), It.IsAny<int?>()))
                .ReturnsAsync(new ModerationResult { IsUnsafe = false, FlagReason = null, ConfidenceScore = 0 });

            _service = new ImageService(_context, _logger.Object, _options.Object, _webHostEnvironment.Object, _moderationService.Object);
        }

        [Fact]
        public async Task UploadImageAsync_ValidImage_CreatesDatabaseRecord()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            // Create test user and cue
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test.jpg", "image/jpeg");

            // Act
            var request = new ImageUploadRequest
            {
                File = imageFile,
                CueId = cueId,
                DisplayOrder = 0,
                IsPrimary = false
            };
            var result = await _service.UploadImageAsync(request, userId);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ImageUrl.Should().NotBeNullOrEmpty();
            result.ImageId.Should().BeGreaterThan(0);

            // Verify database record
            var imageInDb = await _context.CueImages.FirstOrDefaultAsync();
            imageInDb.Should().NotBeNull();
            imageInDb.CueId.Should().Be(cueId);
            imageInDb.ImageUrl.Should().Contain($"/uploads/{cueId}/");
            imageInDb.IsPrimary.Should().BeFalse();
        }

        [Fact]
        public async Task UploadImageAsync_SetAsPrimary_UnsetsOtherPrimaryImages()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            // Create existing primary image
            var existingImage = new CueImage
            {
                CueId = cueId,
                ImageUrl = "/uploads/cues/test1.jpg",
                IsPrimary = true,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(existingImage);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test2.jpg", "image/jpeg");

            // Act
            var request = new ImageUploadRequest
            {
                File = imageFile,
                CueId = cueId,
                DisplayOrder = 0,
                IsPrimary = true
            };
            var result = await _service.UploadImageAsync(request, userId);

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
        public async Task UploadImageAsync_InvalidUser_ReturnsFailure()
        {
            // Arrange
            var userId = 1;
            var wrongUserId = 999;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test.jpg", "image/jpeg");

            // Act & Assert
            var request = new ImageUploadRequest
            {
                File = imageFile,
                CueId = cueId
            };
            var result = await _service.UploadImageAsync(request, wrongUserId);
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task UploadImageAsync_InvalidImageFile_ReturnsFailure()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateEmptyTestImageFile("test.jpg", "image/jpeg");

            // Act & Assert
            var request = new ImageUploadRequest
            {
                File = imageFile,
                CueId = cueId
            };
            var result = await _service.UploadImageAsync(request, userId);
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task UploadImageAsync_InvalidFileExtension_ReturnsFailure()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var imageFile = CreateTestImageFile("test.exe", "application/octet-stream");

            // Act & Assert
            var request = new ImageUploadRequest
            {
                File = imageFile,
                CueId = cueId
            };
            var result = await _service.UploadImageAsync(request, userId);
            result.Success.Should().BeFalse();
            result.ErrorMessage.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task GetCueImagesAsync_ReturnsImagesInCorrectOrder()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/1.jpg", DisplayOrder = 2, IsPrimary = false, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/2.jpg", DisplayOrder = 1, IsPrimary = true, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/3.jpg", DisplayOrder = 0, IsPrimary = false, UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetCueImagesAsync(cueId);

            // Assert
            result.Should().HaveCount(3);
            result[0].DisplayOrder.Should().Be(0);
            result[1].DisplayOrder.Should().Be(1);
            result[2].DisplayOrder.Should().Be(2);
        }

        [Fact]
        public async Task GetImageByIdAsync_ReturnsCorrectImage()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cueId,
                ImageUrl = "/uploads/cues/test.jpg",
                AltText = "Test image",
                DisplayOrder = 1,
                IsPrimary = true,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.GetImageAsync(image.Id);

            // Assert
            result.Should().NotBeNull();
            result.CueId.Should().Be(cueId);
            result.ImageUrl.Should().Be("/uploads/cues/test.jpg");
            result.AltText.Should().Be("Test image");
            result.IsPrimary.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteImageAsync_ValidUser_DeletesImage()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cueId,
                ImageUrl = "/uploads/cues/test.jpg",
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Create physical file
            var fileName = Path.GetFileName(image.ImageUrl);
            var filePath = Path.Combine(_testUploadPath, cueId.ToString(), fileName);
            Directory.CreateDirectory(Path.GetDirectoryName(filePath));
            File.WriteAllText(filePath, "test content");

            // Act
            var result = await _service.DeleteImageAsync(image.Id, userId);

            // Assert
            result.Should().BeTrue();

            // Verify database record deleted
            var imageInDb = await _context.CueImages.FindAsync(image.Id);
            imageInDb.Should().BeNull();

            // Verify physical file deleted
            File.Exists(filePath).Should().BeFalse();
        }

        [Fact]
        public async Task DeleteImageAsync_WrongUser_ReturnsFalse()
        {
            // Arrange
            var userId = 1;
            var wrongUserId = 999;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cueId,
                ImageUrl = "/uploads/cues/test.jpg",
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act & Assert
            var result = await _service.DeleteImageAsync(image.Id, wrongUserId);
            result.Should().BeFalse();
        }

        [Fact]
        public async Task SetPrimaryImageAsync_ValidUser_SetsPrimary()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/1.jpg", IsPrimary = true, UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/2.jpg", IsPrimary = false, UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.SetPrimaryImageAsync(images[1].Id, userId);

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
        public async Task UpdateImageOrderAsync_ValidUser_UpdatesOrder()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var image = new CueImage
            {
                CueId = cueId,
                ImageUrl = "/uploads/cues/test.jpg",
                DisplayOrder = 5,
                UploadedAt = DateTime.UtcNow
            };
            _context.CueImages.Add(image);
            await _context.SaveChangesAsync();

            // Act
            var result = await _service.UpdateImageOrderAsync(image.Id, 10);

            // Assert
            result.Should().BeTrue();

            var updatedImage = await _context.CueImages.FindAsync(image.Id);
            updatedImage.DisplayOrder.Should().Be(10);
        }

        [Fact]
        public async Task UploadStandaloneAsync_ValidImage_ReturnsImageUrl()
        {
            // Arrange
            var imageFile = CreateTestImageFile("standalone.jpg", "image/jpeg");

            // Act
            var result = await _service.UploadStandaloneAsync(imageFile);

            // Assert
            result.Should().NotBeNull();
            result.Success.Should().BeTrue();
            result.ImageUrl.Should().Contain("/uploads/misc/");
            result.FileSize.Should().BeGreaterThan(0);
        }

        [Fact]
        public async Task EnsureStorageRootExists_CreatesDirectory()
        {
            // Arrange
            var newService = new ImageService(_context, _logger.Object, _options.Object, _webHostEnvironment.Object);

            // Act
            newService.EnsureStorageRootExists();

            // Assert
            Directory.Exists(_testUploadPath).Should().BeTrue();
        }

        [Fact]
        public async Task DeleteCueImagesInternalAsync_DeletesAllImages()
        {
            // Arrange
            var userId = 1;
            var cueId = 1;
            
            var user = new User { Id = userId, Username = "testuser", IsActive = true };
            var cue = new Cue { Id = cueId, Title = "Test Cue", UserId = userId };
            _context.Users.Add(user);
            _context.Cues.Add(cue);
            await _context.SaveChangesAsync();

            var images = new[]
            {
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/1.jpg", UploadedAt = DateTime.UtcNow },
                new CueImage { CueId = cueId, ImageUrl = "/uploads/cues/2.jpg", UploadedAt = DateTime.UtcNow }
            };
            _context.CueImages.AddRange(images);
            await _context.SaveChangesAsync();

            // Create physical files
            foreach (var image in images)
            {
                var fileName = Path.GetFileName(image.ImageUrl);
                var filePath = Path.Combine(_testUploadPath, cueId.ToString(), fileName);
                Directory.CreateDirectory(Path.GetDirectoryName(filePath));
                File.WriteAllText(filePath, "test content");
            }

            // Act
            await _service.DeleteCueImagesInternalAsync(cueId);

            // Assert
            var remainingImages = await _context.CueImages.Where(i => i.CueId == cueId).ToListAsync();
            remainingImages.Should().HaveCount(0);

            // Verify physical files deleted
            var cueFolder = Path.Combine(_testUploadPath, cueId.ToString());
            Directory.Exists(cueFolder).Should().BeFalse();
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

        private IFormFile CreateEmptyTestImageFile(string fileName, string contentType)
        {
            var stream = new MemoryStream(Array.Empty<byte>());
            return new FormFile(stream, 0, 0, "file", fileName)
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
