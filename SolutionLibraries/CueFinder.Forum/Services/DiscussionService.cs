using MassTransit;
using CueFinder.Forum.Models;
using CueFinder.Forum.Repositories;
using CueFinder.Forum.Events;

namespace CueFinder.Forum.Services;

/// <summary>
/// Service for managing forum discussions
/// </summary>
public interface IDiscussionService
{
    Task<Discussion> CreateDiscussionAsync(string title, string content, Guid userId, Guid categoryId);
    Task<Discussion?> GetDiscussionAsync(Guid id);
    Task<IEnumerable<Discussion>> GetCategoryDiscussionsAsync(Guid categoryId);
    Task<IEnumerable<Discussion>> GetUserDiscussionsAsync(Guid userId);
    Task<IEnumerable<Discussion>> GetPinnedDiscussionsAsync();
    Task<IEnumerable<Discussion>> SearchDiscussionsAsync(string searchTerm);
    Task PinDiscussionAsync(Guid discussionId, Guid userId);
    Task UnpinDiscussionAsync(Guid discussionId, Guid userId);
    Task LockDiscussionAsync(Guid discussionId, Guid userId, string? reason = null);
    Task UnlockDiscussionAsync(Guid discussionId, Guid userId);
    Task DeleteDiscussionAsync(Guid discussionId, Guid userId);
    Task IncrementViewCountAsync(Guid discussionId, Guid userId);
}

public class DiscussionService : IDiscussionService
{
    private readonly IDiscussionRepository _discussionRepository;
    private readonly IPublishEndpoint _publishEndpoint;

    public DiscussionService(IDiscussionRepository discussionRepository, IPublishEndpoint publishEndpoint)
    {
        _discussionRepository = discussionRepository;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<Discussion> CreateDiscussionAsync(string title, string content, Guid userId, Guid categoryId)
    {
        var discussion = new Discussion
        {
            Title = title,
            Content = content,
            CreatedByUserId = userId,
            CategoryId = categoryId
        };

        await _discussionRepository.AddAsync(discussion);
        await _discussionRepository.SaveChangesAsync();

        // Publish event
        await _publishEndpoint.Publish(new DiscussionCreatedEvent
        {
            DiscussionId = discussion.Id,
            Title = discussion.Title,
            CreatedByUserId = userId,
            CategoryId = categoryId,
            CreatedAt = discussion.CreatedAt
        });

        return discussion;
    }

    public async Task<Discussion?> GetDiscussionAsync(Guid id)
    {
        return await _discussionRepository.GetWithPostsAsync(id);
    }

    public async Task<IEnumerable<Discussion>> GetCategoryDiscussionsAsync(Guid categoryId)
    {
        return await _discussionRepository.GetByCategoryAsync(categoryId);
    }

    public async Task<IEnumerable<Discussion>> GetUserDiscussionsAsync(Guid userId)
    {
        return await _discussionRepository.GetByUserAsync(userId);
    }

    public async Task<IEnumerable<Discussion>> GetPinnedDiscussionsAsync()
    {
        return await _discussionRepository.GetPinnedAsync();
    }

    public async Task<IEnumerable<Discussion>> SearchDiscussionsAsync(string searchTerm)
    {
        return await _discussionRepository.SearchAsync(searchTerm);
    }

    public async Task PinDiscussionAsync(Guid discussionId, Guid userId)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) throw new InvalidOperationException("Discussion not found");

        discussion.IsPinned = true;
        discussion.ModifiedAt = DateTime.UtcNow;

        await _discussionRepository.UpdateAsync(discussion);
        await _discussionRepository.SaveChangesAsync();

        await _publishEndpoint.Publish(new DiscussionPinnedEvent
        {
            DiscussionId = discussionId,
            Title = discussion.Title,
            PinnedByUserId = userId,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task UnpinDiscussionAsync(Guid discussionId, Guid userId)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) throw new InvalidOperationException("Discussion not found");

        discussion.IsPinned = false;
        discussion.ModifiedAt = DateTime.UtcNow;

        await _discussionRepository.UpdateAsync(discussion);
        await _discussionRepository.SaveChangesAsync();
    }

    public async Task LockDiscussionAsync(Guid discussionId, Guid userId, string? reason = null)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) throw new InvalidOperationException("Discussion not found");

        discussion.IsLocked = true;
        discussion.ModifiedAt = DateTime.UtcNow;

        await _discussionRepository.UpdateAsync(discussion);
        await _discussionRepository.SaveChangesAsync();

        await _publishEndpoint.Publish(new DiscussionLockedEvent
        {
            DiscussionId = discussionId,
            Title = discussion.Title,
            LockedByUserId = userId,
            Reason = reason,
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task UnlockDiscussionAsync(Guid discussionId, Guid userId)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) throw new InvalidOperationException("Discussion not found");

        discussion.IsLocked = false;
        discussion.ModifiedAt = DateTime.UtcNow;

        await _discussionRepository.UpdateAsync(discussion);
        await _discussionRepository.SaveChangesAsync();
    }

    public async Task DeleteDiscussionAsync(Guid discussionId, Guid userId)
    {
        await _discussionRepository.DeleteAsync(discussionId);
        await _discussionRepository.SaveChangesAsync();
    }

    public async Task IncrementViewCountAsync(Guid discussionId, Guid userId)
    {
        var discussion = await _discussionRepository.GetByIdAsync(discussionId);
        if (discussion == null) return;

        discussion.ViewCount++;
        await _discussionRepository.UpdateAsync(discussion);
        await _discussionRepository.SaveChangesAsync();
    }
}
