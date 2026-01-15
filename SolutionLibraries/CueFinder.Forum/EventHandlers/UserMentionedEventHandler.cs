using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles UserMentionedEvent - creates mention notifications
/// </summary>
public class UserMentionedEventHandler : IConsumer<UserMentionedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly IMentionRepository _mentionRepository;
    private readonly ILogger<UserMentionedEventHandler> _logger;

    public UserMentionedEventHandler(
        IForumNotificationService notificationService,
        IMentionRepository mentionRepository,
        ILogger<UserMentionedEventHandler> logger)
    {
        _notificationService = notificationService;
        _mentionRepository = mentionRepository;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<UserMentionedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "User {MentionedUserId} was mentioned by {MentionedByUserId} in post {PostId}",
                @event.MentionedUserId,
                @event.MentionedByUserId,
                @event.PostId);

            // Create mention record in database
            var mention = new PostMention
            {
                PostId = @event.PostId,
                MentionedUserId = @event.MentionedUserId
            };

            await _mentionRepository.AddAsync(mention);
            await _mentionRepository.SaveChangesAsync();

            // Create notification for mentioned user
            await _notificationService.CreateNotificationAsync(
                @event.MentionedUserId,
                ForumNotification.NotificationType.Mentioned.ToString(),
                $"You were mentioned in '{@event.DiscussionTitle}'",
                $"A user mentioned you in a discussion.",
                @event.DiscussionId,
                @event.PostId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling UserMentionedEvent");
            throw;
        }
    }
}
