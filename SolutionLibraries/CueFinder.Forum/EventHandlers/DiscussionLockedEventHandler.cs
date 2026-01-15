using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles DiscussionLockedEvent - notifies discussion subscribers
/// </summary>
public class DiscussionLockedEventHandler : IConsumer<DiscussionLockedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly IDiscussionRepository _discussionRepository;
    private readonly ILogger<DiscussionLockedEventHandler> _logger;

    public DiscussionLockedEventHandler(
        IForumNotificationService notificationService,
        IDiscussionRepository discussionRepository,
        ILogger<DiscussionLockedEventHandler> logger)
    {
        _notificationService = notificationService;
        _discussionRepository = discussionRepository;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DiscussionLockedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "Discussion {DiscussionId} was locked. Reason: {Reason}",
                @event.DiscussionId,
                @event.Reason);

            // Get discussion and notify subscribers
            var discussion = await _discussionRepository.GetByIdAsync(@event.DiscussionId);
            if (discussion == null)
            {
                _logger.LogWarning("Discussion {DiscussionId} not found", @event.DiscussionId);
                return;
            }

            // Notify all subscribers
            foreach (var subscription in discussion.Subscriptions)
            {
                var reasonText = string.IsNullOrEmpty(@event.Reason) ? "" : $" Reason: {@event.Reason}";
                
                await _notificationService.CreateNotificationAsync(
                    subscription.UserId,
                    ForumNotification.NotificationType.DiscussionClosed.ToString(),
                    $"Discussion '{@event.Title}' was locked",
                    $"The discussion you're following has been locked and no new replies can be added.{reasonText}",
                    @event.DiscussionId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DiscussionLockedEvent");
            throw;
        }
    }
}
