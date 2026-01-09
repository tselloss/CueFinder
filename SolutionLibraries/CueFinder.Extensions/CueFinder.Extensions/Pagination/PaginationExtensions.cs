namespace CueFinder.Extensions.Pagination;

/// <summary>
/// Extensions for pagination operations
/// </summary>
public static class PaginationExtensions
{
    /// <summary>
    /// Applies pagination to a queryable collection
    /// </summary>
    public static IQueryable<T> Paginate<T>(
        this IQueryable<T> query,
        int page,
        int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // Max page size

        return query
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }

    /// <summary>
    /// Applies pagination to an enumerable collection
    /// </summary>
    public static IEnumerable<T> Paginate<T>(
        this IEnumerable<T> collection,
        int page,
        int pageSize)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100; // Max page size

        return collection
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
    }

    /// <summary>
    /// Creates a paginated result with metadata
    /// </summary>
    public static PaginatedResult<T> ToPaginatedResult<T>(
        this IEnumerable<T> source,
        int page,
        int pageSize,
        int totalCount)
    {
        return new PaginatedResult<T>
        {
            Items = source,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasPreviousPage = page > 1,
            HasNextPage = page * pageSize < totalCount
        };
    }

    /// <summary>
    /// Creates a paginated result from a queryable with automatic count
    /// </summary>
    public static async Task<PaginatedResult<T>> ToPaginatedResultAsync<T>(
        this IQueryable<T> query,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 100) pageSize = 100;

        var totalCount = query.Count();
        var items = await Task.Run(() => 
            query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList(), 
            cancellationToken);

        return new PaginatedResult<T>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasPreviousPage = page > 1,
            HasNextPage = page * pageSize < totalCount
        };
    }

    /// <summary>
    /// Calculates the total number of pages
    /// </summary>
    public static int CalculateTotalPages(int totalCount, int pageSize)
    {
        return (int)Math.Ceiling(totalCount / (double)pageSize);
    }

    /// <summary>
    /// Validates pagination parameters
    /// </summary>
    public static (int page, int pageSize) ValidatePaginationParams(
        int page,
        int pageSize,
        int defaultPageSize = 10,
        int maxPageSize = 100)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = defaultPageSize;
        if (pageSize > maxPageSize) pageSize = maxPageSize;

        return (page, pageSize);
    }
}

/// <summary>
/// Represents a paginated result
/// </summary>
public class PaginatedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public bool HasPreviousPage { get; set; }
    public bool HasNextPage { get; set; }
}
