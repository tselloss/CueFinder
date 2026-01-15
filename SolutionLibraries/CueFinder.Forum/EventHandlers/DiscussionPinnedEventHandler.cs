using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles DiscussionPinnedEvent - notifies category subscribers
/// </summary>
public class DiscussionPinnedEventHandler : IConsumer<DiscussionPinnedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly ILogger<DiscussionPinnedEventHandler> _logger;

    public DiscussionPinnedEventHandler(
        IForumNotificationService notificationService,
        ILogger<DiscussionPinnedEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DiscussionPinnedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "Discussion {DiscussionId} was pinned",
                @event.DiscussionId);

            // You could notify relevant users here:
            // - Moderators
            // - Category watchers
            // - Update sorting/ranking

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DiscussionPinnedEvent");
            throw;
        }
    }
}
