using CueFinder.Database.Context;
using CueFinder.Database.Models;
using CueFinder.Messages.Services;
using CueFinder.Raffles.Models;
using CueFinder.Raffles.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Raffles.Tests.Services
{
    public class RaffleServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<IMessageService> _messageService = new();
        private readonly Mock<ILogger<RaffleService>> _logger = new();
        private readonly RaffleService _service;

        public RaffleServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new CueFinderDbContext(options);
            _service = new RaffleService(_context, _messageService.Object, _logger.Object);
        }

        #region Test Helpers

        private async Task<User> CreateTestUserAsync(string username)
        {
            var user = new User
            {
                Username = username,
                PasswordHash = "hash",
                Email = $"{username}@test.com",
                Role = "user",
                IsActive = true
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return user;
        }

        private async Task<Raffle> CreateTestRaffleAsync(int organizerId, bool autoEndWhenFull = false, int totalSpots = 10)
        {
            var raffle = new Raffle
            {
                OrganizerId = organizerId,
                Title = "Test Raffle",
                Description = "Test Description",
                TotalSpots = totalSpots,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = autoEndWhenFull,
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            _context.Raffles.Add(raffle);
            await _context.SaveChangesAsync();
            return raffle;
        }

        private async Task<RaffleEntry> CreateTestEntryAsync(int raffleId, int userId, int spotNumber, string status = "pending")
        {
            var entry = new RaffleEntry
            {
                RaffleId = raffleId,
                UserId = userId,
                SpotNumber = spotNumber,
                Status = status,
                PaymentMethod = "dm",
                CreatedAt = DateTime.UtcNow
            };
            _context.RaffleEntries.Add(entry);
            await _context.SaveChangesAsync();
            return entry;
        }

        #endregion

        #region Create Tests

        [Fact]
        public async Task CreateRaffleAsync_WithAutoEndWhenFull_SavesCorrectly()
        {
            // Arrange
            var user = await CreateTestUserAsync("organizer");
            var dto = new CreateRaffleDto
            {
                Title = "Auto-End Raffle",
                Description = "Test",
                TotalSpots = 50,
                PricePerSpot = 5,
                EndsAt = DateTime.UtcNow.AddDays(30),
                AutoEndWhenFull = true,
                AcceptDM = true
            };

            // Act
            var created = await _service.CreateRaffleAsync(dto, user.Id);

            // Assert
            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            
            var raffleFromDb = await _context.Raffles.FindAsync(created.Id);
            raffleFromDb.Should().NotBeNull();
            raffleFromDb!.AutoEndWhenFull.Should().BeTrue();
        }

        [Fact]
        public async Task CreateRaffleAsync_WithoutAutoEndWhenFull_DefaultsToFalse()
        {
            // Arrange
            var user = await CreateTestUserAsync("organizer2");
            var dto = new CreateRaffleDto
            {
                Title = "Normal Raffle",
                TotalSpots = 20,
                PricePerSpot = 10,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = false,
                AcceptDM = true
            };

            // Act
            var created = await _service.CreateRaffleAsync(dto, user.Id);

            // Assert
            var raffleFromDb = await _context.Raffles.FindAsync(created.Id);
            raffleFromDb!.AutoEndWhenFull.Should().BeFalse();
        }

        #endregion

        #region Update Tests

        [Fact]
        public async Task UpdateRaffleAsync_WithNoBookings_UpdatesSuccessfully()
        {
            // Arrange
            var user = await CreateTestUserAsync("owner");
            var raffle = await CreateTestRaffleAsync(user.Id);
            
            var updateDto = new CreateRaffleDto
            {
                Title = "Updated Title",
                TotalSpots = 20,
                PricePerSpot = 15,
                EndsAt = DateTime.UtcNow.AddDays(10),
                AutoEndWhenFull = true,
                AcceptDM = true
            };

            // Act
            var updated = await _service.UpdateRaffleAsync(raffle.Id, updateDto, user.Id);

            // Assert
            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Updated Title");
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.AutoEndWhenFull.Should().BeTrue();
        }

        [Fact]
        public async Task UpdateRaffleAsync_WithPendingBooking_ThrowsInvalidOperationException()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer3");
            var buyer = await CreateTestUserAsync("buyer1");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "pending");

            var updateDto = new CreateRaffleDto
            {
                Title = "Should Fail",
                TotalSpots = 20,
                PricePerSpot = 10,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.UpdateRaffleAsync(raffle.Id, updateDto, organizer.Id)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task UpdateRaffleAsync_WithPaidBooking_ThrowsInvalidOperationException()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer4");
            var buyer = await CreateTestUserAsync("buyer2");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "paid");

            var updateDto = new CreateRaffleDto
            {
                Title = "Should Fail",
                TotalSpots = 20,
                PricePerSpot = 10,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.UpdateRaffleAsync(raffle.Id, updateDto, organizer.Id)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task UpdateRaffleAsync_WithRefundedBooking_UpdatesSuccessfully()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer5");
            var buyer = await CreateTestUserAsync("buyer3");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "refunded");

            var updateDto = new CreateRaffleDto
            {
                Title = "Should Succeed",
                TotalSpots = 20,
                PricePerSpot = 10,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            // Act
            var updated = await _service.UpdateRaffleAsync(raffle.Id, updateDto, organizer.Id);

            // Assert
            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Should Succeed");
        }

        [Fact]
        public async Task UpdateRaffleAsync_WithWrongUser_ThrowsUnauthorizedAccessException()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer6");
            var otherUser = await CreateTestUserAsync("other");
            var raffle = await CreateTestRaffleAsync(organizer.Id);

            var updateDto = new CreateRaffleDto
            {
                Title = "Unauthorized",
                TotalSpots = 10,
                PricePerSpot = 10,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(
                () => _service.UpdateRaffleAsync(raffle.Id, updateDto, otherUser.Id)
            );
        }

        #endregion

        #region Delete Tests

        [Fact]
        public async Task DeleteRaffleAsync_WithNoBookings_DeletesSuccessfully()
        {
            // Arrange
            var user = await CreateTestUserAsync("deleter");
            var raffle = await CreateTestRaffleAsync(user.Id);

            // Act
            var result = await _service.DeleteRaffleAsync(raffle.Id, user.Id, false);

            // Assert
            result.Should().BeTrue();
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("cancelled");
        }

        [Fact]
        public async Task DeleteRaffleAsync_WithPendingBooking_ThrowsInvalidOperationException()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer7");
            var buyer = await CreateTestUserAsync("buyer4");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "pending");

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.DeleteRaffleAsync(raffle.Id, organizer.Id, false)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task DeleteRaffleAsync_WithPaidBooking_ThrowsInvalidOperationException()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer8");
            var buyer = await CreateTestUserAsync("buyer5");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "paid");

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service.DeleteRaffleAsync(raffle.Id, organizer.Id, false)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task DeleteRaffleAsync_WithRefundedBooking_DeletesSuccessfully()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer9");
            var buyer = await CreateTestUserAsync("buyer6");
            var raffle = await CreateTestRaffleAsync(organizer.Id);
            await CreateTestEntryAsync(raffle.Id, buyer.Id, 1, "refunded");

            // Act
            var result = await _service.DeleteRaffleAsync(raffle.Id, organizer.Id, false);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task DeleteRaffleAsync_AsAdmin_BypassesOwnerCheck()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer10");
            var admin = await CreateTestUserAsync("admin");
            var raffle = await CreateTestRaffleAsync(organizer.Id);

            // Act
            var result = await _service.DeleteRaffleAsync(raffle.Id, admin.Id, true);

            // Assert
            result.Should().BeTrue();
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("cancelled");
        }

        #endregion

        #region AutoEndWhenFull Tests

        [Fact]
        public async Task EnterRaffleAsync_AutoEndDisabled_DoesNotCloseWhenFull()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer11");
            var raffle = await CreateTestRaffleAsync(organizer.Id, autoEndWhenFull: false, totalSpots: 2);
            
            var buyer1 = await CreateTestUserAsync("buyer7");
            var buyer2 = await CreateTestUserAsync("buyer8");

            // Act
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 1, ChosenPaymentMethod = "dm" }, buyer1.Id);
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);

            // Assert
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("open");
        }

        [Fact]
        public async Task EnterRaffleAsync_AutoEndEnabled_ClosesWhenAllSpotsClaimed()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer12");
            var raffle = await CreateTestRaffleAsync(organizer.Id, autoEndWhenFull: true, totalSpots: 2);
            
            var buyer1 = await CreateTestUserAsync("buyer9");
            var buyer2 = await CreateTestUserAsync("buyer10");

            // Act
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 1, ChosenPaymentMethod = "dm" }, buyer1.Id);
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);

            // Assert
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("closed");
            
            // Verify organizer was notified
            _messageService.Verify(
                m => m.SendSystemNotificationAsync(
                    organizer.Id,
                    It.Is<string>(s => s.Contains("Full")),
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task VerifyEntryAsync_AutoEndEnabled_ClosesWhenAllSpotsPaid()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer13");
            var raffle = await CreateTestRaffleAsync(organizer.Id, autoEndWhenFull: true, totalSpots: 2);
            
            var buyer1 = await CreateTestUserAsync("buyer11");
            var buyer2 = await CreateTestUserAsync("buyer12");

            var entry1 = await CreateTestEntryAsync(raffle.Id, buyer1.Id, 1, "pending");
            var entry2 = await CreateTestEntryAsync(raffle.Id, buyer2.Id, 2, "pending");

            // Act
            await _service.VerifyEntryAsync(raffle.Id, entry1.Id, new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref1" }, organizer.Id);
            
            // Raffle should still be open after first payment
            var raffleAfterFirst = await _context.Raffles.FindAsync(raffle.Id);
            raffleAfterFirst!.Status.Should().Be("open");

            await _service.VerifyEntryAsync(raffle.Id, entry2.Id, new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref2" }, organizer.Id);

            // Assert - should be closed after all paid
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("closed");
            
            // Verify organizer was notified about raffle being ready
            _messageService.Verify(
                m => m.SendSystemNotificationAsync(
                    organizer.Id,
                    It.Is<string>(s => s.Contains("Ready")),
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task VerifyEntryAsync_AutoEndDisabled_DoesNotCloseWhenAllPaid()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer14");
            var raffle = await CreateTestRaffleAsync(organizer.Id, autoEndWhenFull: false, totalSpots: 2);
            
            var buyer1 = await CreateTestUserAsync("buyer13");
            var buyer2 = await CreateTestUserAsync("buyer14");

            var entry1 = await CreateTestEntryAsync(raffle.Id, buyer1.Id, 1, "pending");
            var entry2 = await CreateTestEntryAsync(raffle.Id, buyer2.Id, 2, "pending");

            // Act
            await _service.VerifyEntryAsync(raffle.Id, entry1.Id, new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref1" }, organizer.Id);
            await _service.VerifyEntryAsync(raffle.Id, entry2.Id, new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref2" }, organizer.Id);

            // Assert
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("open");
        }

        [Fact]
        public async Task EnterRaffleAsync_AutoEndEnabled_OnlyCountsActiveEntries()
        {
            // Arrange
            var organizer = await CreateTestUserAsync("organizer15");
            var raffle = await CreateTestRaffleAsync(organizer.Id, autoEndWhenFull: true, totalSpots: 3);
            
            var buyer1 = await CreateTestUserAsync("buyer15");
            var buyer2 = await CreateTestUserAsync("buyer16");
            var buyer3 = await CreateTestUserAsync("buyer17");

            // Create one refunded entry (shouldn't count)
            await CreateTestEntryAsync(raffle.Id, buyer1.Id, 1, "refunded");

            // Act - claim 2 more spots (total 3, but only 2 active)
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);
            await _service.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 3, ChosenPaymentMethod = "dm" }, buyer3.Id);

            // Assert - should still be open because we only have 2 active out of 3 needed
            var raffleFromDb = await _context.Raffles.FindAsync(raffle.Id);
            raffleFromDb!.Status.Should().Be("open");
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
