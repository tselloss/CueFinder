using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles PostMarkedAsHelpfulEvent - notifies post owner and updates reputation
/// </summary>
public class PostMarkedAsHelpfulEventHandler : IConsumer<PostMarkedAsHelpfulEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly ILogger<PostMarkedAsHelpfulEventHandler> _logger;

    public PostMarkedAsHelpfulEventHandler(
        IForumNotificationService notificationService,
        ILogger<PostMarkedAsHelpfulEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PostMarkedAsHelpfulEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "Post {PostId} was marked as helpful by {UserId}. Total helpful: {TotalHelpful}",
                @event.PostId,
                @event.MarkedByUserId,
                @event.TotalHelpful);

            // Notify post owner
            await _notificationService.CreateNotificationAsync(
                @event.PostOwnerUserId,
                ForumNotification.NotificationType.PostMarkedAsHelpful.ToString(),
                "Your post was marked as helpful!",
                $"Someone found your post helpful ({@event.TotalHelpful} total helpful marks).",
                @event.DiscussionId,
                @event.PostId);

            // You could also:
            // - Update user reputation/badges
            // - Track helpful posts for ranking
            // - Send achievement notifications
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling PostMarkedAsHelpfulEvent");
            throw;
        }
    }
}
