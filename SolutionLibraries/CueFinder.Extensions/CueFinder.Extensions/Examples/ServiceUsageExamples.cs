using CueFinder.Extensions.Validation;
using CueFinder.Extensions.Logging;
using CueFinder.Extensions.Caching;
using Microsoft.Extensions.Logging;

namespace CueFinder.Extensions.Examples;

/// <summary>
/// Example service demonstrating the use of CueFinder.Extensions in services
/// </summary>
public class ExampleService
{
    private readonly ILogger<ExampleService> _logger;
    private readonly ICacheService _cache;

    public ExampleService(
        ILogger<ExampleService> logger,
        ICacheService cache)
    {
        _logger = logger;
        _cache = cache;
    }

    /// <summary>
    /// Example: Service method with caching and logging
    /// </summary>
    public async Task<SampleItem?> GetByIdAsync(int id)
    {
        _logger.LogMethodEntry(nameof(GetByIdAsync), new { id });

        return await _logger.LogExecutionTimeAsync(
            nameof(GetByIdAsync),
            async () =>
            {
                // Try get from cache
                var cacheKey = $"item:{id}";
                var cached = await _cache.GetAsync<SampleItem>(cacheKey);
                
                if (cached != null)
                {
                    _logger.LogCacheOperation("Hit", cacheKey);
                    return cached;
                }

                _logger.LogCacheOperation("Miss", cacheKey);
                _logger.LogDatabaseOperation("SELECT", "SampleItem", new { id });

                // Simulate database call
                await Task.Delay(100);
                var item = new SampleItem 
                { 
                    Id = id, 
                    Title = $"Item {id}",
                    Price = 100.00m
                };

                // Cache the result
                if (item != null)
                {
                    await _cache.SetAsync(cacheKey, item, TimeSpan.FromMinutes(10));
                    _logger.LogCacheOperation("Set", cacheKey);
                }

                _logger.LogMethodExit(nameof(GetByIdAsync), new { found = item != null });
                return item;
            });
    }

    /// <summary>
    /// Example: Creating an item with validation
    /// </summary>
    public async Task<SampleItem> CreateAsync(CreateItemRequest request, int userId)
    {
        _logger.LogUserAction(userId, "CreateItem", request);

        // Validate inputs
        if (!request.Title.IsNotNullOrEmpty())
        {
            _logger.LogValidationError("Title", "Title is required");
            throw new ArgumentException("Title is required", nameof(request.Title));
        }

        if (!request.Title.HasValidLength(3, 200))
        {
            _logger.LogValidationError("Title", "Title must be between 3 and 200 characters", request.Title);
            throw new ArgumentException("Title must be between 3 and 200 characters", nameof(request.Title));
        }

        if (!request.Email.IsValidEmail())
        {
            _logger.LogValidationError("Email", "Invalid email format", request.Email);
            throw new ArgumentException("Invalid email format", nameof(request.Email));
        }

        if (request.Price.HasValue && !request.Price.Value.IsValidPrice())
        {
            _logger.LogValidationError("Price", "Invalid price", request.Price);
            throw new ArgumentException("Price must be positive with max 2 decimal places", nameof(request.Price));
        }

        // Sanitize inputs
        var item = new SampleItem
        {
            Id = new Random().Next(1000, 9999),
            Title = request.Title.Sanitize(),
            Description = request.Description?.Sanitize(),
            Price = request.Price,
            Email = request.Email,
            UserId = userId
        };

        _logger.LogDatabaseOperation("INSERT", "SampleItem", item);

        // Simulate database insert
        await Task.Delay(50);

        // Invalidate cache
        await _cache.RemoveAsync("items:list");
        _logger.LogCacheOperation("Invalidate", "items:list");

        _logger.LogInformation("Item {Id} created successfully by user {UserId}", item.Id, userId);

        return item;
    }

    /// <summary>
    /// Example: Updating with business rule validation
    /// </summary>
    public async Task<SampleItem> UpdateAsync(int id, CreateItemRequest request, int userId)
    {
        _logger.LogUserAction(userId, "UpdateItem", new { id, request });

        var item = await GetByIdAsync(id);
        if (item == null)
        {
            _logger.LogWarning("Item {Id} not found", id);
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        // Business rule: Users can only update their own items
        if (item.UserId != userId)
        {
            _logger.LogBusinessRuleViolation(
                "ItemOwnership",
                $"User {userId} attempted to modify item {id} owned by user {item.UserId}",
                userId);
            
            throw new UnauthorizedAccessException("You can only update your own items");
        }

        // Validate and update
        if (!request.Title.IsNotNullOrEmpty() || !request.Title.HasValidLength(3, 200))
        {
            _logger.LogValidationError("Title", "Invalid title", request.Title);
            throw new ArgumentException("Title is invalid");
        }

        item.Title = request.Title.Sanitize();
        item.Description = request.Description?.Sanitize();
        item.Price = request.Price;

        _logger.LogDatabaseOperation("UPDATE", "SampleItem", new { id });

        // Simulate database update
        await Task.Delay(50);

        // Invalidate caches
        await _cache.RemoveAsync($"item:{id}");
        await _cache.RemoveAsync("items:list");
        
        _logger.LogInformation("Item {Id} updated successfully by user {UserId}", id, userId);

        return item;
    }

    /// <summary>
    /// Example: Deleting with authorization check
    /// </summary>
    public async Task DeleteAsync(int id, int userId, bool isAdmin)
    {
        _logger.LogUserAction(userId, "DeleteItem", new { id });

        var item = await GetByIdAsync(id);
        if (item == null)
        {
            _logger.LogWarning("Item {Id} not found", id);
            throw new KeyNotFoundException($"Item with ID {id} not found");
        }

        // Business rule: Only admins or item owners can delete
        if (!isAdmin && item.UserId != userId)
        {
            _logger.LogSecurityEvent(
                "UnauthorizedDeleteAttempt",
                userId,
                $"User {userId} attempted to delete item {id} owned by user {item.UserId}");
            
            throw new UnauthorizedAccessException("You don't have permission to delete this item");
        }

        _logger.LogDatabaseOperation("DELETE", "SampleItem", new { id });

        // Simulate database delete
        await Task.Delay(50);

        // Invalidate caches
        await _cache.RemoveAsync($"item:{id}");
        await _cache.RemoveAsync("items:list");

        _logger.LogInformation("Item {Id} deleted by user {UserId} (Admin: {IsAdmin})", id, userId, isAdmin);
    }

    /// <summary>
    /// Example: External API call with logging
    /// </summary>
    public async Task<string> CallExternalApiAsync(string endpoint)
    {
        _logger.LogExternalApiCall("ExternalService", endpoint, "GET");

        try
        {
            return await _logger.LogExecutionTimeAsync(
                "ExternalAPICall",
                async () =>
                {
                    // Simulate API call
                    await Task.Delay(500);
                    return "API Response";
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "External API call failed: {Endpoint}", endpoint);
            throw;
        }
    }

    /// <summary>
    /// Example: Bulk operation with progress logging
    /// </summary>
    public async Task<int> BulkCreateAsync(List<CreateItemRequest> requests, int userId)
    {
        _logger.LogUserAction(userId, "BulkCreateItems", new { count = requests.Count });

        var created = 0;
        foreach (var request in requests)
        {
            try
            {
                await CreateAsync(request, userId);
                created++;
                
                if (created % 10 == 0)
                {
                    _logger.LogInformation("Bulk create progress: {Created}/{Total}", created, requests.Count);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create item in bulk: {Title}", request.Title);
            }
        }

        _logger.LogInformation("Bulk create completed: {Created}/{Total} items created", created, requests.Count);
        return created;
    }
}

// Local example DTOs to keep examples self-contained after removing ExampleController
public class CreateItemRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string Email { get; set; } = string.Empty;
}

public class SampleItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal? Price { get; set; }
    public string Email { get; set; } = string.Empty;
    public int UserId { get; set; }
}
