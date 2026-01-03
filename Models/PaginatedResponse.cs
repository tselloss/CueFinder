namespace CueFinder.Models
{
    /// <summary>
    /// Paginated response wrapper for list queries
    /// </summary>
    public class PaginatedResponse<T>
    {
        /// <summary>
        /// Collection of items
        /// </summary>
        public List<T> Items { get; set; } = new();

        /// <summary>
        /// Total count of all items matching the filter
        /// </summary>
        public int TotalCount { get; set; }

        /// <summary>
        /// Current page number
        /// </summary>
        public int PageNumber { get; set; }

        /// <summary>
        /// Items per page
        /// </summary>
        public int PageSize { get; set; }

        /// <summary>
        /// Total number of pages
        /// </summary>
        public int TotalPages => (TotalCount + PageSize - 1) / PageSize;

        /// <summary>
        /// Whether there are more pages
        /// </summary>
        public bool HasNextPage => PageNumber < TotalPages;

        /// <summary>
        /// Whether there are previous pages
        /// </summary>
        public bool HasPreviousPage => PageNumber > 1;
    }
}
