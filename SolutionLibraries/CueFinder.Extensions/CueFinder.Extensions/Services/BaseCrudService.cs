using CueFinder.Database.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CueFinder.Extensions.Services;

/// <summary>
/// Base service class providing common CRUD patterns and utilities
/// Reduces code duplication across services
/// </summary>
/// <typeparam name="TEntity">The entity type</typeparam>
/// <typeparam name="TResponseDto">The response DTO type</typeparam>
public abstract class BaseCrudService<TEntity, TResponseDto> where TEntity : class
{
    protected readonly CueFinderDbContext Context;
    protected readonly ILogger Logger;

    protected BaseCrudService(CueFinderDbContext context, ILogger logger)
    {
        Context = context;
        Logger = logger;
    }

    /// <summary>
    /// Common filtering logic for GetAll operations
    /// </summary>
    protected IQueryable<TEntity> ApplyFilters(
        IQueryable<TEntity> query,
        Func<TEntity, bool> condition)
    {
        return query.Where(condition).AsQueryable();
    }

    /// <summary>
    /// Common sorting logic
    /// </summary>
    protected IQueryable<TEntity> ApplySorting<TKey>(
        IQueryable<TEntity> query,
        Func<TEntity, TKey> orderBy,
        bool descending = true)
    {
        return descending 
            ? query.OrderByDescending(orderBy).AsQueryable()
            : query.OrderBy(orderBy).AsQueryable();
    }

    /// <summary>
    /// Handle common GetAll filtering and sorting patterns
    /// </summary>
    protected List<TResponseDto> FilterAndSort<TKey>(
        List<TEntity> items,
        Func<TEntity, bool>? filter,
        Func<TEntity, TKey> sortKey,
        bool descending = true)
    {
        var query = items.AsEnumerable();

        if (filter != null)
            query = query.Where(filter);

        query = descending
            ? query.OrderByDescending(sortKey)
            : query.OrderBy(sortKey);

        return query.Select(MapToResponseDto).ToList();
    }

    /// <summary>
    /// Abstract method that each service must implement for DTO mapping
    /// </summary>
    protected abstract TResponseDto MapToResponseDto(TEntity entity);

    /// <summary>
    /// Log error with consistent format
    /// </summary>
    protected void LogError(Exception ex, string message, params object[] args)
    {
        Logger.LogError(ex, message, args);
    }

    /// <summary>
    /// Log information with consistent format
    /// </summary>
    protected void LogInfo(string message, params object[] args)
    {
        Logger.LogInformation(message, args);
    }

    /// <summary>
    /// Check if item belongs to user (for authorization)
    /// </summary>
    protected void VerifyOwnership<TOwned>(TOwned item, int userId, Func<TOwned, int> getUserId)
        where TOwned : class
    {
        if (getUserId(item) != userId)
            throw new UnauthorizedAccessException("You do not have permission to access this resource");
    }
}
