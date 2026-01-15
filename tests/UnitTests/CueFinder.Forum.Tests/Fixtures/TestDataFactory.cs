using CueFinder.Forum.Models;

namespace CueFinder.Forum.Tests.Fixtures;

/// <summary>
/// Test data factory for creating test entities
/// </summary>
public static class TestDataFactory
{
    public static ForumCategory CreateCategory(string? name = null)
    {
        return new ForumCategory
        {
            Id = Guid.NewGuid(),
            Name = name ?? "Test Category",
            Description = "Test Description",
            IsActive = true
        };
    }

    public static Discussion CreateDiscussion(Guid? categoryId = null, Guid? userId = null)
    {
        return new Discussion
        {
            Id = Guid.NewGuid(),
            Title = "Test Discussion",
            Content = "Test Discussion Content",
            CategoryId = categoryId ?? Guid.NewGuid(),
            CreatedByUserId = userId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            ModifiedAt = DateTime.UtcNow
        };
    }

    public static Post CreatePost(Guid? discussionId = null, Guid? userId = null)
    {
        return new Post
        {
            Id = Guid.NewGuid(),
            Content = "Test Post Content",
            DiscussionId = discussionId ?? Guid.NewGuid(),
            CreatedByUserId = userId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            ModifiedAt = DateTime.UtcNow
        };
    }

    public static PostLike CreatePostLike(Guid? postId = null, Guid? userId = null)
    {
        return new PostLike
        {
            Id = Guid.NewGuid(),
            PostId = postId ?? Guid.NewGuid(),
            UserId = userId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public static PostMention CreateMention(Guid? postId = null, Guid? mentionedUserId = null)
    {
        return new PostMention
        {
            Id = Guid.NewGuid(),
            PostId = postId ?? Guid.NewGuid(),
            MentionedUserId = mentionedUserId ?? Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow
        };
    }

    public static ForumNotification CreateNotification(Guid? userId = null)
    {
        return new ForumNotification
        {
            Id = Guid.NewGuid(),
            UserId = userId ?? Guid.NewGuid(),
            Type = "ReplyAdded",
            Title = "Test Notification",
            Message = "Test Message",
            CreatedAt = DateTime.UtcNow
        };
    }
}
