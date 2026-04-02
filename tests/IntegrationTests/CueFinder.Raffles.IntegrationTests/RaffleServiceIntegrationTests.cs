using CueFinder.Database.IntegrationTests.Infrastructure;
using CueFinder.Database.Models;
using CueFinder.Messages.Services;
using CueFinder.Raffles.Models;
using CueFinder.Raffles.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CueFinder.Raffles.IntegrationTests
{
    public class RaffleServiceIntegrationTests : DatabaseTestBase
    {
        private RaffleService? _service;
        private Mock<IMessageService>? _messageService;

        private void EnsureInit()
        {
            if (_service == null)
            {
                var logger = new TestLogger<RaffleService>();
                _messageService = new Mock<IMessageService>();
                _service = new RaffleService(Context, _messageService.Object, logger);
            }
        }

        private async Task<User> CreateTestUser(string username)
        {
            var user = new User
            {
                Username = username,
                Email = $"{username}@test.com",
                PasswordHash = "hash",
                Role = "user",
                IsActive = true
            };
            Context.Users.Add(user);
            await Context.SaveChangesAsync();
            return user;
        }

        #region Create and Update with AutoEndWhenFull Tests

        [Fact]
        public async Task CreateRaffle_WithAutoEndWhenFull_CreatesSuccessfully()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_create_auto");

            var dto = new CreateRaffleDto
            {
                Title = "Auto-End Integration Test",
                Description = "Test raffle with auto-end",
                TotalSpots = 100,
                PricePerSpot = 5m,
                EndsAt = DateTime.UtcNow.AddDays(30),
                AutoEndWhenFull = true,
                AcceptDM = true
            };

            var created = await _service!.CreateRaffleAsync(dto, organizer.Id);

            created.Should().NotBeNull();
            created.Id.Should().BeGreaterThan(0);
            
            // Verify in database
            var raffleFromDb = await Context.Raffles.FindAsync(created.Id);
            raffleFromDb.Should().NotBeNull();
            raffleFromDb!.AutoEndWhenFull.Should().BeTrue();
            raffleFromDb.Status.Should().Be("open");
        }

        [Fact]
        public async Task UpdateRaffle_CanToggleAutoEndWhenFull()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_toggle");

            // Create without auto-end
            var createDto = new CreateRaffleDto
            {
                Title = "Toggle Test",
                TotalSpots = 50,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = false,
                AcceptDM = true
            };

            var created = await _service!.CreateRaffleAsync(createDto, organizer.Id);
            created.Should().NotBeNull();

            // Update to enable auto-end
            var updateDto = new CreateRaffleDto
            {
                Title = "Toggle Test Updated",
                TotalSpots = 50,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = true,
                AcceptDM = true
            };

            var updated = await _service!.UpdateRaffleAsync(created.Id, updateDto, organizer.Id);
            
            updated.Should().NotBeNull();
            var raffleFromDb = await Context.Raffles.FindAsync(created.Id);
            raffleFromDb!.AutoEndWhenFull.Should().BeTrue();
        }

        #endregion

        #region Edit/Delete Validation Tests

        [Fact]
        public async Task UpdateRaffle_WithActiveBooking_ThrowsException()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_edit_fail");
            var buyer = await CreateTestUser("buyer_edit_fail");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Test Raffle",
                TotalSpots = 10,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            // Add a pending entry
            var entry = new RaffleEntry
            {
                RaffleId = raffle.Id,
                UserId = buyer.Id,
                SpotNumber = 1,
                Status = "pending",
                PaymentMethod = "dm",
                CreatedAt = DateTime.UtcNow
            };
            Context.RaffleEntries.Add(entry);
            await Context.SaveChangesAsync();

            // Attempt to update
            var updateDto = new CreateRaffleDto
            {
                Title = "Updated Title",
                TotalSpots = 10,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service!.UpdateRaffleAsync(raffle.Id, updateDto, organizer.Id)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task DeleteRaffle_WithActiveBooking_ThrowsException()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_delete_fail");
            var buyer = await CreateTestUser("buyer_delete_fail");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Test Raffle",
                TotalSpots = 10,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            // Add a paid entry
            var entry = new RaffleEntry
            {
                RaffleId = raffle.Id,
                UserId = buyer.Id,
                SpotNumber = 1,
                Status = "paid",
                PaymentMethod = "dm",
                PaymentReference = "ref123",
                CreatedAt = DateTime.UtcNow,
                PaidAt = DateTime.UtcNow
            };
            Context.RaffleEntries.Add(entry);
            await Context.SaveChangesAsync();

            // Attempt to delete
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _service!.DeleteRaffleAsync(raffle.Id, organizer.Id, false)
            );
            exception.Message.Should().Contain("active bookings");
        }

        [Fact]
        public async Task UpdateRaffle_WithRefundedBooking_Succeeds()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_edit_refund");
            var buyer = await CreateTestUser("buyer_edit_refund");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Test Raffle",
                TotalSpots = 10,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            // Add a refunded entry (should not block update)
            var entry = new RaffleEntry
            {
                RaffleId = raffle.Id,
                UserId = buyer.Id,
                SpotNumber = 1,
                Status = "refunded",
                PaymentMethod = "dm",
                CreatedAt = DateTime.UtcNow
            };
            Context.RaffleEntries.Add(entry);
            await Context.SaveChangesAsync();

            // Should succeed
            var updateDto = new CreateRaffleDto
            {
                Title = "Updated Successfully",
                TotalSpots = 10,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AcceptDM = true
            };

            var updated = await _service!.UpdateRaffleAsync(raffle.Id, updateDto, organizer.Id);
            updated.Should().NotBeNull();
            updated!.Title.Should().Be("Updated Successfully");
        }

        #endregion

        #region AutoEndWhenFull Integration Tests

        [Fact]
        public async Task EnterRaffle_AutoEndEnabled_ClosesWhenFullyClaimed()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_auto_claim");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Auto-Close Test",
                TotalSpots = 3,
                PricePerSpot = 5m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = true,
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            var buyer1 = await CreateTestUser("buyer_auto_1");
            var buyer2 = await CreateTestUser("buyer_auto_2");
            var buyer3 = await CreateTestUser("buyer_auto_3");

            // Claim first two spots - should stay open
            await _service!.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 1, ChosenPaymentMethod = "dm" }, buyer1.Id);
            await _service!.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);

            var raffleAfterTwo = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterTwo!.Status.Should().Be("open");

            // Claim third spot - should auto-close
            await _service!.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 3, ChosenPaymentMethod = "dm" }, buyer3.Id);

            var raffleAfterThree = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterThree!.Status.Should().Be("closed");

            // Verify notification was sent
            _messageService!.Verify(
                m => m.SendSystemNotificationAsync(
                    organizer.Id,
                    It.Is<string>(s => s.Contains("Full")),
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task VerifyEntry_AutoEndEnabled_ClosesWhenFullyPaid()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_auto_paid");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Auto-Close Paid Test",
                TotalSpots = 2,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = true,
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            var buyer1 = await CreateTestUser("buyer_paid_1");
            var buyer2 = await CreateTestUser("buyer_paid_2");

            var entry1 = new RaffleEntry
            {
                RaffleId = raffle.Id,
                UserId = buyer1.Id,
                SpotNumber = 1,
                Status = "pending",
                PaymentMethod = "dm",
                CreatedAt = DateTime.UtcNow
            };
            var entry2 = new RaffleEntry
            {
                RaffleId = raffle.Id,
                UserId = buyer2.Id,
                SpotNumber = 2,
                Status = "pending",
                PaymentMethod = "dm",
                CreatedAt = DateTime.UtcNow
            };
            Context.RaffleEntries.AddRange(entry1, entry2);
            await Context.SaveChangesAsync();

            // Verify first entry - should stay open
            await _service!.VerifyEntryAsync(raffle.Id, entry1.Id, 
                new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref1" }, organizer.Id);

            var raffleAfterFirst = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterFirst!.Status.Should().Be("open");

            // Verify second entry - should auto-close
            await _service!.VerifyEntryAsync(raffle.Id, entry2.Id, 
                new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "ref2" }, organizer.Id);

            var raffleAfterSecond = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterSecond!.Status.Should().Be("closed");

            // Verify notification was sent
            _messageService!.Verify(
                m => m.SendSystemNotificationAsync(
                    organizer.Id,
                    It.Is<string>(s => s.Contains("Ready")),
                    It.IsAny<string>()),
                Times.Once);
        }

        [Fact]
        public async Task EnterRaffle_AutoEndDisabled_StaysOpenWhenFull()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_no_auto");

            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Manual Close Test",
                TotalSpots = 2,
                PricePerSpot = 5m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = false,
                Status = "open",
                AcceptDM = true,
                CreatedAt = DateTime.UtcNow
            };
            Context.Raffles.Add(raffle);
            await Context.SaveChangesAsync();

            var buyer1 = await CreateTestUser("buyer_manual_1");
            var buyer2 = await CreateTestUser("buyer_manual_2");

            // Claim all spots
            await _service!.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 1, ChosenPaymentMethod = "dm" }, buyer1.Id);
            await _service!.EnterRaffleAsync(raffle.Id, new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);

            // Should still be open
            var raffleAfterFull = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterFull!.Status.Should().Be("open");

            // No notification should be sent for full raffle
            _messageService!.Verify(
                m => m.SendSystemNotificationAsync(
                    It.IsAny<int>(),
                    It.Is<string>(s => s.Contains("Full")),
                    It.IsAny<string>()),
                Times.Never);
        }

        [Fact]
        public async Task CompleteRaffleWorkflow_WithAutoEnd_WorksEndToEnd()
        {
            EnsureInit();
            var organizer = await CreateTestUser("organizer_workflow");

            // Create raffle with auto-end
            var createDto = new CreateRaffleDto
            {
                Title = "Workflow Test Raffle",
                Description = "End-to-end test",
                TotalSpots = 2,
                PricePerSpot = 20m,
                EndsAt = DateTime.UtcNow.AddDays(14),
                AutoEndWhenFull = true,
                AcceptPayPal = true,
                AcceptDM = true,
                PaymentDetails = "PayPal: test@example.com"
            };

            var raffle = await _service!.CreateRaffleAsync(createDto, organizer.Id);
            raffle.Should().NotBeNull();

            var buyer1 = await CreateTestUser("buyer_workflow_1");
            var buyer2 = await CreateTestUser("buyer_workflow_2");

            // Enter raffle - claim spots
            var entry1 = await _service!.EnterRaffleAsync(raffle.Id, 
                new EnterRaffleDto { SpotNumber = 1, ChosenPaymentMethod = "paypal" }, buyer1.Id);
            var entry2 = await _service!.EnterRaffleAsync(raffle.Id, 
                new EnterRaffleDto { SpotNumber = 2, ChosenPaymentMethod = "dm" }, buyer2.Id);

            entry1.Should().NotBeNull();
            entry2.Should().NotBeNull();

            // Raffle should be closed after all spots claimed
            var raffleAfterEntries = await Context.Raffles.FindAsync(raffle.Id);
            raffleAfterEntries!.Status.Should().Be("closed");

            // Verify payments (even though closed, we can still verify)
            await _service!.VerifyEntryAsync(raffle.Id, entry1.Id, 
                new VerifyEntryDto { PaymentMethod = "paypal", PaymentReference = "TXN123" }, organizer.Id);
            await _service!.VerifyEntryAsync(raffle.Id, entry2.Id, 
                new VerifyEntryDto { PaymentMethod = "dm", PaymentReference = "CASH" }, organizer.Id);

            // Entries should be marked as paid
            var verifiedEntry1 = await Context.RaffleEntries.FindAsync(entry1.Id);
            var verifiedEntry2 = await Context.RaffleEntries.FindAsync(entry2.Id);
            
            verifiedEntry1!.Status.Should().Be("paid");
            verifiedEntry2!.Status.Should().Be("paid");
            verifiedEntry1.PaymentReference.Should().Be("TXN123");
            verifiedEntry2.PaymentReference.Should().Be("CASH");

            // Verify organizer received notifications
            _messageService!.Verify(
                m => m.SendSystemNotificationAsync(
                    organizer.Id,
                    It.IsAny<string>(),
                    It.IsAny<string>()),
                Times.AtLeastOnce);
        }

        #endregion
    }
}
