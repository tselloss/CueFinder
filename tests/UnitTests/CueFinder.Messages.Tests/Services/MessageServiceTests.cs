using CueFinder.Messages.Services;
using CueFinder.Messages.Models;
using CueFinder.Messages.Hubs;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.SignalR;
using Moq;
using FluentAssertions;
using Xunit;

namespace CueFinder.Messages.Tests.Services
{
    public class MessageServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly MessageService _messageService;
        private readonly Mock<IHubContext<MessageHub>> _mockHubContext;
        private readonly Mock<ILogger<MessageService>> _mockLogger;

        public MessageServiceTests()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            
            // Setup SignalR hub mocks
            _mockHubContext = new Mock<IHubContext<MessageHub>>();
            var mockClients = new Mock<IHubClients>();
            var mockClientProxy = new Mock<IClientProxy>();
            
            mockClientProxy
                .Setup(x => x.SendCoreAsync(It.IsAny<string>(), It.IsAny<object[]>(), default))
                .Returns(Task.CompletedTask);
            
            mockClients
                .Setup(x => x.Group(It.IsAny<string>()))
                .Returns(mockClientProxy.Object);
            
            _mockHubContext
                .Setup(x => x.Clients)
                .Returns(mockClients.Object);
            
            _mockLogger = new Mock<ILogger<MessageService>>();
            _messageService = new MessageService(_context, _mockHubContext.Object, _mockLogger.Object);

            SeedTestData();
        }

        private void SeedTestData()
        {
            var users = new List<User>
            {
                new User { Id = 1, Username = "sender1", Email = "sender1@test.com", PasswordHash = "hash1" },
                new User { Id = 2, Username = "recipient1", Email = "recipient1@test.com", PasswordHash = "hash2" },
                new User { Id = 3, Username = "otheruser", Email = "other@test.com", PasswordHash = "hash3" }
            };

            var cues = new List<Cue>
            {
                new Cue 
                { 
                    Id = 1,
                    UserId = 1,
                    Brand = "TestBrand",
                    Title = "Test Cue",
                    Price = 100,
                    Description = "Test Cue",
                    Weight = 18.5m,
                    CreatedAt = DateTime.UtcNow
                }
            };

            var messages = new List<Message>
            {
                new Message
                {
                    Id = 1,
                    SenderId = 1,
                    RecipientId = 2,
                    Subject = "Test Message 1",
                    Content = "Content 1",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-2)
                },
                new Message
                {
                    Id = 2,
                    SenderId = 1,
                    RecipientId = 2,
                    Subject = "Test Message 2",
                    Content = "Content 2",
                    IsRead = true,
                    ReadAt = DateTime.UtcNow.AddHours(-1),
                    CreatedAt = DateTime.UtcNow.AddHours(-3)
                },
                new Message
                {
                    Id = 3,
                    SenderId = 2,
                    RecipientId = 1,
                    Subject = "Reply Message",
                    Content = "Reply Content",
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-1)
                },
                new Message
                {
                    Id = 4,
                    SenderId = null,
                    RecipientId = 2,
                    Subject = "System Notification",
                    Content = "System message",
                    IsSystem = true,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-4)
                }
            };

            _context.Users.AddRange(users);
            _context.Cues.AddRange(cues);
            _context.Messages.AddRange(messages);
            _context.SaveChanges();
        }

        #region SendMessageAsync Tests

        [Fact]
        public async Task SendMessageAsync_ValidMessage_CreatesMessage()
        {
            // Arrange
            var request = new SendMessageRequest
            {
                RecipientId = 2,
                Subject = "New Message",
                Content = "New message content"
            };

            // Act
            var result = await _messageService.SendMessageAsync(1, request);

            // Assert
            result.Should().NotBeNull();
            result.Subject.Should().Be("New Message");
            result.Content.Should().Be("New message content");
            result.SenderId.Should().Be(1);
            result.RecipientId.Should().Be(2);
            result.IsRead.Should().BeFalse();

            var dbMessage = await _context.Messages.FindAsync(result.Id);
            dbMessage.Should().NotBeNull();
        }

        [Fact]
        public async Task SendMessageAsync_WithCueId_RequiresRecipientToBeOwner()
        {
            // Arrange - User 1 owns the cue, User 2 is trying to send message about it
            var request = new SendMessageRequest
            {
                RecipientId = 2, // Not the owner
                Subject = "About Cue",
                Content = "Interested in your cue",
                CueId = 1 // Owned by User 1
            };

            // Act & Assert - Should throw because recipient must be cue owner
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _messageService.SendMessageAsync(1, request));
        }

        [Fact]
        public async Task SendMessageAsync_InvalidRecipient_ThrowsException()
        {
            // Arrange
            var request = new SendMessageRequest
            {
                RecipientId = 999, // Non-existent user
                Subject = "Test",
                Content = "Test content"
            };

            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _messageService.SendMessageAsync(1, request));
        }

        #endregion

        #region ReplyToMessageAsync Tests

        [Fact]
        public async Task ReplyToMessageAsync_ValidReply_CreatesReplyMessage()
        {
            // Arrange
            int originalMessageId = 1;
            string replyContent = "This is a reply";

            // Act
            var result = await _messageService.ReplyToMessageAsync(originalMessageId, 2, replyContent);

            // Assert
            result.Should().NotBeNull();
            result.Content.Should().Be(replyContent);
            result.SenderId.Should().Be(2);
            result.RecipientId.Should().Be(1); // Reply goes to original sender
            result.Subject.Should().Contain("Re:"); // Should have "Re:" prefix
        }

        [Fact]
        public async Task ReplyToMessageAsync_InvalidMessage_ThrowsException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _messageService.ReplyToMessageAsync(999, 2, "Reply content"));
        }

        [Fact]
        public async Task ReplyToMessageAsync_UnauthorizedUser_ThrowsException()
        {
            // Arrange - User 3 tries to reply to message between User 1 and 2
            int messageId = 1;

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _messageService.ReplyToMessageAsync(messageId, 3, "Unauthorized reply"));
        }

        #endregion

        #region DeleteMessageAsync Tests

        [Fact]
        public async Task DeleteMessageAsync_SenderCanDelete_ReturnsTrue()
        {
            // Arrange
            int messageId = 1;

            // Act
            var result = await _messageService.DeleteMessageAsync(messageId, 1); // Sender

            // Assert
            result.Should().BeTrue();
            var deletedMessage = await _context.Messages.FindAsync(messageId);
            deletedMessage.Should().BeNull();
        }

        [Fact]
        public async Task DeleteMessageAsync_RecipientCanDelete_ReturnsTrue()
        {
            // Arrange
            int messageId = 1;

            // Act
            var result = await _messageService.DeleteMessageAsync(messageId, 2); // Recipient

            // Assert
            result.Should().BeTrue();
            var deletedMessage = await _context.Messages.FindAsync(messageId);
            deletedMessage.Should().BeNull();
        }

        [Fact]
        public async Task DeleteMessageAsync_UnauthorizedUser_ThrowsException()
        {
            // Arrange
            int messageId = 1;

            // Act & Assert
            await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
                await _messageService.DeleteMessageAsync(messageId, 3)); // Not involved
        }

        [Fact]
        public async Task DeleteMessageAsync_InvalidMessage_ReturnsFalse()
        {
            // Act
            var result = await _messageService.DeleteMessageAsync(999, 1);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region GetInboxAsync Tests

        [Fact]
        public async Task GetInboxAsync_ReturnsAllMessages()
        {
            // Act
            var result = await _messageService.GetInboxAsync(2);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3); // Messages with IDs 1, 2, and 4
            result.Should().Contain(m => m.Id == 1);
            result.Should().Contain(m => m.Id == 2);
            result.Should().Contain(m => m.Id == 4); // System message
        }

        [Fact]
        public async Task GetInboxAsync_UnreadOnly_ReturnsOnlyUnreadMessages()
        {
            // Act
            var result = await _messageService.GetInboxAsync(2, unreadOnly: true);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2); // Messages 1 and 4 are unread
            result.Should().Contain(m => m.Id == 1);
            result.Should().Contain(m => m.Id == 4);
            result.Should().NotContain(m => m.Id == 2); // Message 2 is read
        }

        [Fact]
        public async Task GetInboxAsync_NoMessages_ReturnsEmptyList()
        {
            // Act
            var result = await _messageService.GetInboxAsync(3); // User with no messages

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region GetSentAsync Tests

        [Fact]
        public async Task GetSentAsync_ReturnsSentMessages()
        {
            // Act
            var result = await _messageService.GetSentAsync(1);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2); // Messages with IDs 1 and 2
            result.Should().Contain(m => m.Id == 1);
            result.Should().Contain(m => m.Id == 2);
            result.Should().NotContain(m => m.Id == 3); // Sent by user 2
        }

        [Fact]
        public async Task GetSentAsync_NoMessages_ReturnsEmptyList()
        {
            // Act
            var result = await _messageService.GetSentAsync(3); // User with no sent messages

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region GetThreadAsync Tests

        [Fact]
        public async Task GetThreadAsync_ReturnsConversationBetweenUsers()
        {
            // Act
            var result = await _messageService.GetThreadAsync(1, 2);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(3); // Messages 1, 2, 3 are between users 1 and 2
            result.Should().Contain(m => m.Id == 1);
            result.Should().Contain(m => m.Id == 2);
            result.Should().Contain(m => m.Id == 3);
        }

        [Fact]
        public async Task GetThreadAsync_WithCueId_FiltersByCue()
        {
            // Arrange - Create message with cue association
            var messageWithCue = new Message
            {
                Id = 5,
                SenderId = 1,
                RecipientId = 2,
                Subject = "About specific cue",
                Content = "Cue discussion",
                CueId = 1,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };
            _context.Messages.Add(messageWithCue);
            await _context.SaveChangesAsync();

            // Act
            var result = await _messageService.GetThreadAsync(1, 2, cueId: 1);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(1); // Only message with CueId = 1
            result.First().Id.Should().Be(5);
            result.First().CueId.Should().Be(1);
        }

        [Fact]
        public async Task GetThreadAsync_NoConversation_ReturnsEmptyList()
        {
            // Act
            var result = await _messageService.GetThreadAsync(1, 3); // No messages between these users

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEmpty();
        }

        #endregion

        #region MarkAsReadAsync Tests

        [Fact]
        public async Task MarkAsReadAsync_RecipientMarksRead_UpdatesMessage()
        {
            // Arrange
            int messageId = 1;
            var beforeMark = DateTime.UtcNow;

            // Act
            var result = await _messageService.MarkAsReadAsync(messageId, 2); // Recipient

            // Assert
            result.Should().BeTrue();

            var message = await _context.Messages.FindAsync(messageId);
            message.Should().NotBeNull();
            message!.IsRead.Should().BeTrue();
            message.ReadAt.Should().NotBeNull();
            message.ReadAt.Should().BeOnOrAfter(beforeMark);
        }

        [Fact]
        public async Task MarkAsReadAsync_SenderCannotMark_ReturnsFalse()
        {
            // Arrange
            int messageId = 1;

            // Act
            var result = await _messageService.MarkAsReadAsync(messageId, 1); // Sender

            // Assert
            result.Should().BeFalse();

            var message = await _context.Messages.FindAsync(messageId);
            message!.IsRead.Should().BeFalse(); // Should remain unread
        }

        [Fact]
        public async Task MarkAsReadAsync_UnauthorizedUser_ReturnsFalse()
        {
            // Arrange
            int messageId = 1;

            // Act
            var result = await _messageService.MarkAsReadAsync(messageId, 3); // Not involved

            // Assert
            result.Should().BeFalse();

            var message = await _context.Messages.FindAsync(messageId);
            message!.IsRead.Should().BeFalse();
        }

        [Fact]
        public async Task MarkAsReadAsync_InvalidMessage_ReturnsFalse()
        {
            // Act
            var result = await _messageService.MarkAsReadAsync(999, 2);

            // Assert
            result.Should().BeFalse();
        }

        #endregion

        #region SendSystemNotificationAsync Tests

        [Fact]
        public async Task SendSystemNotificationAsync_CreatesSystemMessage()
        {
            // Act
            await _messageService.SendSystemNotificationAsync(2, "System Alert", "This is a system notification");

            // Assert
            var systemMessages = await _context.Messages
                .Where(m => m.RecipientId == 2 && m.IsSystem == true && m.Subject == "System Alert")
                .ToListAsync();

            systemMessages.Should().HaveCount(1);
            var message = systemMessages.First();
            message.SenderId.Should().BeNull();
            message.IsSystem.Should().BeTrue();
            message.Content.Should().Be("This is a system notification");
            message.RecipientId.Should().Be(2);
        }

        [Fact]
        public async Task SendSystemNotificationAsync_InvalidRecipient_ThrowsException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<InvalidOperationException>(async () =>
                await _messageService.SendSystemNotificationAsync(999, "Subject", "Content"));
        }

        #endregion

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
