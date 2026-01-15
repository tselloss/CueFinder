using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles PostCreatedEvent - creates notifications, processes mentions
/// </summary>
public class PostCreatedEventHandler : IConsumer<PostCreatedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly IDiscussionRepository _discussionRepository;
    private readonly ILogger<PostCreatedEventHandler> _logger;

    public PostCreatedEventHandler(
        IForumNotificationService notificationService,
        IDiscussionRepository discussionRepository,
        ILogger<PostCreatedEventHandler> logger)
    {
        _notificationService = notificationService;
        _discussionRepository = discussionRepository;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PostCreatedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "New post created in discussion {DiscussionId}",
                @event.DiscussionId);

            // Get discussion details for notification
            var discussion = await _discussionRepository.GetByIdAsync(@event.DiscussionId);
            if (discussion == null)
            {
                _logger.LogWarning("Discussion {DiscussionId} not found", @event.DiscussionId);
                return;
            }

            // Notify discussion subscribers (except the post creator)
            var subscriptions = discussion.Subscriptions
                .Where(s => s.UserId != @event.CreatedByUserId && s.NotifyOnNewPost);

            foreach (var subscription in subscriptions)
            {
                await _notificationService.CreateNotificationAsync(
                    subscription.UserId,
                    ForumNotification.NotificationType.ReplyAdded.ToString(),
                    $"New reply in '{discussion.Title}'",
                    "Someone replied to a discussion you're following.",
                    @event.DiscussionId,
                    @event.PostId);
            }

            // Handle mentions if any
            if (@event.MentionedUserIds.Any())
            {
                await context.Publish(new UserMentionedEvent
                {
                    PostId = @event.PostId,
                    DiscussionId = @event.DiscussionId,
                    MentionedByUserId = @event.CreatedByUserId,
                    PostContent = @event.Content,
                    DiscussionTitle = discussion.Title,
                    CreatedAt = @event.CreatedAt
                });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling PostCreatedEvent");
            throw;
        }
    }
}
