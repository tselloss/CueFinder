using MassTransit;
using Microsoft.Extensions.Logging;
using CueFinder.Forum.Events;
using CueFinder.Forum.Services;
using CueFinder.Forum.Models;

namespace CueFinder.Forum.EventHandlers;

/// <summary>
/// Handles PostLikedEvent - notifies post owner
/// </summary>
public class PostLikedEventHandler : IConsumer<PostLikedEvent>
{
    private readonly IForumNotificationService _notificationService;
    private readonly ILogger<PostLikedEventHandler> _logger;

    public PostLikedEventHandler(
        IForumNotificationService notificationService,
        ILogger<PostLikedEventHandler> logger)
    {
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PostLikedEvent> context)
    {
        try
        {
            var @event = context.Message;

            _logger.LogInformation(
                "Post {PostId} was liked by {UserId}. Total likes: {TotalLikes}",
                @event.PostId,
                @event.LikedByUserId,
                @event.TotalLikes);

            // Notify post owner (unless they liked their own post)
            if (@event.PostOwnerUserId != @event.LikedByUserId)
            {
                await _notificationService.CreateNotificationAsync(
                    @event.PostOwnerUserId,
                    ForumNotification.NotificationType.PostLiked.ToString(),
                    "Your post received a like!",
                    $"Someone liked your post ({@event.TotalLikes} total likes).",
                    @event.DiscussionId,
                    @event.PostId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error handling PostLikedEvent");
            throw;
        }
    }
}
