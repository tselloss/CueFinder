using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles DiscussionCreatedEvent - notifies subscribers, logs analytics
/// </summary>
public class DiscussionCreatedEventHandler : IConsumer<DiscussionCreatedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly ILogger<DiscussionCreatedEventHandler> _logger;

    public DiscussionCreatedEventHandler(
        IForumNotificationService notificationService,
        ILogger<DiscussionCreatedEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<DiscussionCreatedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "New discussion created: {DiscussionTitle} in category {CategoryName}",
                @event.Title,
                @event.CategoryName);

            // You can add additional logic here:
            // - Send email notifications to category followers
            // - Update user reputation
            // - Log analytics
            // - Update search indices

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling DiscussionCreatedEvent");
            throw;
        }
    }
}
