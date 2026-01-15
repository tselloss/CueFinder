# Event-Driven Forum System - Implementation Guide

## Overview
This is a complete event-driven forum system with the following components:

- **Models**: Discussion, Post, ForumCategory, ForumNotification, PostLike, PostMention, DiscussionView, DiscussionSubscription
- **Events**: 7 domain events for real-time communication
- **Services**: DiscussionService, PostService, ForumNotificationService
- **Repositories**: Generic + specialized repositories for data access
- **Event Handlers**: MassTransit consumers for async event processing
- **DbContext**: Fully configured EF Core context with relationships

## Architecture

```
Forum System Architecture:
┌─────────────────────────────────────────────┐
│  Controllers (in CueFinderBE)              │
│  - ForumController                          │
│  - DiscussionController                     │
│  - PostController                           │
└────────────────┬────────────────────────────┘
                 │
┌─────────────────────────────────────────────┐
│  Services Layer                             │
│  - DiscussionService                        │
│  - PostService                              │
│  - ForumNotificationService                 │
└────────────────┬────────────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
┌────────▼─────────┐  ┌──▼──────────────┐
│  Repositories    │  │  MassTransit    │
│  - Discussion    │  │  Event Bus      │
│  - Post          │  │  (Async Events) │
│  - Notification  │  └──┬──────────────┘
└────────┬─────────┘     │
         │          ┌────▼──────────────┐
         │          │ Event Handlers    │
         │          │ - Discussion      │
         │          │ - Post            │
┌────────▼──────────┤ - Mention         │
│  ForumDbContext   │ - Like            │
│  (EF Core)        │ - Helpful         │
│                   │ - Lock            │
└───────────────────┴───────────────────┘
```

## Installation Steps

### 1. Update CueFinderBE Project

In `CueFinderBE.csproj`, add the forum reference:
```xml
<ItemGroup>
  <ProjectReference Include="..\CueFinder.Forum\CueFinder.Forum.csproj" />
</ItemGroup>
```

### 2. Configure Startup (Program.cs)

Add the following to your `Program.cs`:

```csharp
// Add DbContext
builder.Services.AddDbContext<ForumDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ForumDbConnection"))
);

// Add Services
builder.Services.AddScoped<IDiscussionService, DiscussionService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<IForumNotificationService, ForumNotificationService>();

// Add Repositories
builder.Services.AddScoped<IDiscussionRepository, DiscussionRepository>();
builder.Services.AddScoped<IPostRepository, PostRepository>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();

// Configure MassTransit
builder.Services.AddMassTransit(x =>
{
    // Register all consumers (event handlers)
    x.AddConsumersFromNamespaceContaining<DiscussionCreatedEventHandler>();

    x.UsingInMemory((context, cfg) =>
    {
        // For production, use RabbitMQ, Azure Service Bus, etc.
        cfg.ConfigureEndpoints(context);
    });
    
    // Or for RabbitMQ:
    // x.UsingRabbitMq((context, cfg) =>
    // {
    //     cfg.Host(builder.Configuration["RabbitMq:Host"], h => {
    //         h.Username(builder.Configuration["RabbitMq:Username"]);
    //         h.Password(builder.Configuration["RabbitMq:Password"]);
    //     });
    //     cfg.ConfigureEndpoints(context);
    // });
});

// Add SignalR for real-time updates
builder.Services.AddSignalR();

// Map SignalR hub (optional)
// app.MapHub<ForumHub>("/forumHub");
```

### 3. Update appsettings.json

```json
{
  "ConnectionStrings": {
    "ForumDbConnection": "Host=localhost;Database=cuefinder_forum;Username=postgres;Password=your_password"
  },
  "RabbitMq": {
    "Host": "localhost",
    "Username": "guest",
    "Password": "guest"
  }
}
```

### 4. Create Database Migrations

```bash
# From CueFinderBE directory
dotnet ef migrations add InitialForumSetup --project ..\CueFinder.Forum
dotnet ef database update --project ..\CueFinder.Forum
```

### 5. Create Forum Controllers

Create `Controllers/DiscussionController.cs` in CueFinderBE:

```csharp
using Microsoft.AspNetCore.Mvc;
using CueFinder.Forum.Services;

namespace CueFinderBE.Controllers;

[ApiController]
[Route("api/forum/discussions")]
public class DiscussionController : ControllerBase
{
    private readonly IDiscussionService _discussionService;

    public DiscussionController(IDiscussionService discussionService)
    {
        _discussionService = discussionService;
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetDiscussion(Guid id)
    {
        var discussion = await _discussionService.GetDiscussionAsync(id);
        if (discussion == null) return NotFound();
        return Ok(discussion);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDiscussion(
        [FromBody] CreateDiscussionRequest request,
        [FromQuery] Guid userId)
    {
        var discussion = await _discussionService.CreateDiscussionAsync(
            request.Title,
            request.Content,
            userId,
            request.CategoryId);

        return CreatedAtAction(nameof(GetDiscussion), new { id = discussion.Id }, discussion);
    }

    [HttpGet("category/{categoryId}")]
    public async Task<IActionResult> GetCategoryDiscussions(Guid categoryId)
    {
        var discussions = await _discussionService.GetCategoryDiscussionsAsync(categoryId);
        return Ok(discussions);
    }

    // Additional endpoints...
}

public record CreateDiscussionRequest(string Title, string Content, Guid CategoryId);
```

Create `Controllers/PostController.cs`:

```csharp
using Microsoft.AspNetCore.Mvc;
using CueFinder.Forum.Services;

namespace CueFinderBE.Controllers;

[ApiController]
[Route("api/forum/posts")]
public class PostController : ControllerBase
{
    private readonly IPostService _postService;

    public PostController(IPostService postService)
    {
        _postService = postService;
    }

    [HttpPost]
    public async Task<IActionResult> CreatePost(
        [FromBody] CreatePostRequest request,
        [FromQuery] Guid userId)
    {
        var post = await _postService.CreatePostAsync(
            request.DiscussionId,
            request.Content,
            userId,
            request.ReplyToPostId);

        return CreatedAtAction(nameof(GetPost), new { id = post.Id }, post);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(Guid id)
    {
        var post = await _postService.GetPostAsync(id);
        if (post == null) return NotFound();
        return Ok(post);
    }

    [HttpPost("{id}/like")]
    public async Task<IActionResult> LikePost(Guid id, [FromQuery] Guid userId)
    {
        await _postService.LikePostAsync(id, userId);
        return Ok();
    }

    [HttpPost("{id}/helpful")]
    public async Task<IActionResult> MarkAsHelpful(Guid id, [FromQuery] Guid userId)
    {
        await _postService.MarkAsHelpfulAsync(id, userId);
        return Ok();
    }

    // Additional endpoints...
}

public record CreatePostRequest(Guid DiscussionId, string Content, Guid? ReplyToPostId);
```

## Key Features

### 1. Event-Driven Architecture
- Loose coupling between services
- Async event processing via MassTransit
- Scalable to message queues (RabbitMQ, Azure Service Bus)

### 2. Real-Time Notifications
- Automatic notification creation on events
- Subscriber notifications for discussions
- User mention notifications
- Post engagement notifications (likes, helpful marks)

### 3. Data Integrity
- Soft delete support for posts
- Unique constraints on important relationships
- Proper cascade delete policies
- Transaction support

### 4. Search & Filtering
- Discussion search by title/content
- Category-based filtering
- Pinned discussions prioritization
- User post/discussion history

## Testing Events

```csharp
// In a test or endpoint
var discussion = await discussionService.CreateDiscussionAsync(
    "How to choose a cue?",
    "I'm new to billiards and need advice...",
    userId,
    categoryId);

// This automatically:
// 1. Creates the discussion
// 2. Publishes DiscussionCreatedEvent
// 3. Handler processes the event asynchronously
// 4. Notifies subscribers
// 5. Logs analytics
```

## Upgrade Path for Production

1. **Replace In-Memory Bus**: Switch to RabbitMQ or Azure Service Bus
2. **Add Caching**: Implement Redis for discussion/post caching
3. **Add Search**: Integrate Elasticsearch for full-text search
4. **Add SignalR Hub**: Real-time updates for new posts/notifications
5. **User Reputation**: Track user contributions and badges
6. **Content Moderation**: Add flagging and moderation workflows
7. **Analytics**: Track engagement metrics

## Database Schema

The system creates the following tables:
- `Categories` - Forum categories
- `Discussions` - Discussion threads
- `Posts` - Posts/replies
- `ForumNotifications` - User notifications
- `PostLikes` - Post likes
- `PostMentions` - User mentions in posts
- `DiscussionViews` - View tracking
- `DiscussionSubscriptions` - User subscriptions

All with proper indexes for performance optimization.

## Next Steps

1. Configure database connection in appsettings.json
2. Add project reference in CueFinderBE.csproj
3. Run migrations
4. Create API controllers
5. Test with sample data
6. Deploy to staging environment
