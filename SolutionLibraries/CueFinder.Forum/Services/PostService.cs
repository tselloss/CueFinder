using MassTransit;
using Microsoft.EntityFrameworkCore;
using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Events;
using System.Text.RegularExpressions;

namespace CueFinder.Forum.Services;

/// <summary>
/// Service for managing forum posts/replies
/// </summary>
public interface IPostService
{
    Task<Post> CreatePostAsync(Guid discussionId, string content, Guid userId, Guid? replyToPostId = null);
    Task<Post?> GetPostAsync(Guid id);
    Task<IEnumerable<Post>> GetDiscussionPostsAsync(Guid discussionId);
    Task<IEnumerable<Post>> GetUserPostsAsync(Guid userId);
    Task<IEnumerable<Post>> GetPostRepliesAsync(Guid postId);
    Task EditPostAsync(Guid postId, string content, Guid userId);
    Task DeletePostAsync(Guid postId, Guid userId, string? reason = null);
    Task LikePostAsync(Guid postId, Guid userId);
    Task UnlikePostAsync(Guid postId, Guid userId);
    Task MarkAsHelpfulAsync(Guid postId, Guid userId);
    Task<int> GetUserPostCountAsync(Guid userId);
}

public class PostService : IPostService
{
    private readonly IPostRepository _postRepository;
    private readonly IDiscussionRepository _discussionRepository;
    private readonly ILikeRepository _likeRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public PostService(
        IPostRepository postRepository,
        IDiscussionRepository discussionRepository,
        ILikeRepository likeRepository,
        IPublishEndpoint publishEndpoint)
    {
        _postRepository = postRepository;
        _discussionRepository = discussionRepository;
        _likeRepository = likeRepository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Post> CreatePostAsync(Guid discussionId, string content, Guid userId, Guid? replyToPostId = null)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) throw new InvalidOperationException("Discussion not found");

        if (discussion.IsLocked) throw new InvalidOperationException("Discussion is locked");

        var post = new Post
        {
            DiscussionId = discussionId,
            Content = content,
            CreatedByUserId = userId,
            ReplyToPostId = replyToPostId
        };

        await _postRepository.AddAsync(post);
        
        // Update discussion metrics
        discussion.ReplyCount++;
        discussion.LastReplyAt = DateTime.UtcNow;
        await _discussionRepository.UpdateAsync(discussion);
        
        await _postRepository.SaveChangesAsync();

        // Extract mentions from content
        var mentionedUserIds = ExtractMentions(content);

        // Publish event
        await _publishEndpoint.Publish(new PostCreatedEvent
        {
            PostId = post.Id,
            DiscussionId = discussionId,
            Content = content,
            CreatedByUserId = userId,
            ReplyToPostId = replyToPostId,
            MentionedUserIds = mentionedUserIds,
            CreatedAt = post.CreatedAt
        });

        return post;
    }

    public async Task<Post?> GetPostAsync(Guid id)
    {
        return await _postRepository.GetWithMentionsAsync(id);
    }

    public async Task<IEnumerable<Post>> GetDiscussionPostsAsync(Guid discussionId)
    {
        return await _postRepository.GetByDiscussionAsync(discussionId);
    }

    public async Task<IEnumerable<Post>> GetUserPostsAsync(Guid userId)
    {
        return await _postRepository.GetByUserAsync(userId);
    }

    public async Task<IEnumerable<Post>> GetPostRepliesAsync(Guid postId)
    {
        return await _postRepository.GetRepliesAsync(postId);
    }

    public async Task EditPostAsync(Guid postId, string content, Guid userId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null) throw new InvalidOperationException("Post not found");

        if (post.CreatedByUserId != userId) throw new UnauthorizedAccessException("Not authorized to edit this post");

        post.Content = content;
        post.IsEdited = true;
        post.ModifiedAt = DateTime.UtcNow;

        await _postRepository.UpdateAsync(post);
        await _postRepository.SaveChangesAsync();
    }

    public async Task DeletePostAsync(Guid postId, Guid userId, string? reason = null)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null) throw new InvalidOperationException("Post not found");

        post.DeletedAt = DateTime.UtcNow;
        post.DeletionReason = reason;

        await _postRepository.UpdateAsync(post);
        await _postRepository.SaveChangesAsync();
    }

    public async Task LikePostAsync(Guid postId, Guid userId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null) throw new InvalidOperationException("Post not found");

        var existingLike = await _likeRepository.GetLikeAsync(postId, userId);
        if (existingLike != null) return; // User already liked this post

        var like = new PostLike { PostId = postId, UserId = userId };
        
        await _likeRepository.AddAsync(like);
        post.LikeCount++;
        await _postRepository.UpdateAsync(post);
        await _likeRepository.SaveChangesAsync();

        // Publish event
        await _publishEndpoint.Publish(new PostLikedEvent
        {
            PostId = postId,
            DiscussionId = post.DiscussionId,
            LikedByUserId = userId,
            PostOwnerUserId = post.CreatedByUserId,
            TotalLikes = post.LikeCount,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task UnlikePostAsync(Guid postId, Guid userId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null) throw new InvalidOperationException("Post not found");

        var likes = await _postRepository.FindAsync(p => p.Id == postId);
        // Implementation would remove the like

        post.LikeCount--;
        await _postRepository.UpdateAsync(post);
        await _postRepository.SaveChangesAsync();
    }

    public async Task MarkAsHelpfulAsync(Guid postId, Guid userId)
    {
        var post = await _postRepository.GetByIdAsync(postId);
        if (post == null) throw new InvalidOperationException("Post not found");

        post.HelpfulCount++;
        await _postRepository.UpdateAsync(post);
        await _postRepository.SaveChangesAsync();

        // Publish event
        await _publishEndpoint.Publish(new PostMarkedAsHelpfulEvent
        {
            PostId = postId,
            DiscussionId = post.DiscussionId,
            MarkedByUserId = userId,
            PostOwnerUserId = post.CreatedByUserId,
            TotalHelpful = post.HelpfulCount,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<int> GetUserPostCountAsync(Guid userId)
    {
        return await _postRepository.GetPostCountByUserAsync(userId);
    }

    private List<Guid> ExtractMentions(string content)
    {
        var mentions = new List<Guid>();
        var pattern = @"@([a-zA-Z0-9_-]+)";
        var matches = Regex.Matches(content, pattern);

        // In a real implementation, you'd look up user IDs from usernames
        // This is a placeholder
        foreach (Match match in matches)
        {
            // Extract username and convert to Guid
            // var username = match.Groups[1].Value;
            // var userId = await _userService.GetUserIdByUsernameAsync(username);
            // if (userId.HasValue) mentions.Add(userId.Value);
        }

        return mentions;
    }
}
