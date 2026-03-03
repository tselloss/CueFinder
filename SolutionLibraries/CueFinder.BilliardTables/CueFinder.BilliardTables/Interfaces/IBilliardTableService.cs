using CueFinder.BilliardTables.Models;

namespace CueFinder.BilliardTables.Interfaces;

/// <summary>
/// Service interface for billiard table management operations
/// </summary>
public interface IBilliardTableService
{
    /// <summary>
    /// Get all billiard tables with optional filtering
    /// </summary>
    Task<List<BilliardTableResponseDto>> GetAllBilliardTablesAsync(string? condition = null, string? brand = null, 
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest");
    
    /// <summary>
    /// Get a specific billiard table by ID
    /// </summary>
    Task<BilliardTableResponseDto?> GetBilliardTableByIdAsync(int tableId);
    
    /// <summary>
    /// Get all billiard tables created by a specific user
    /// </summary>
    Task<List<BilliardTableResponseDto>> GetUserBilliardTablesAsync(int userId, bool? hidden = null);
    
    /// <summary>
    /// Create a new billiard table listing
    /// </summary>
    Task<BilliardTableResponseDto> CreateBilliardTableAsync(CreateBilliardTableDto dto, int userId);
    
    /// <summary>
    /// Update an existing billiard table (only by owner)
    /// </summary>
    Task<BilliardTableResponseDto?> UpdateBilliardTableAsync(int tableId, UpdateBilliardTableDto dto, int userId);
    
    /// <summary>
    /// Delete a billiard table (only by owner or admin)
    /// </summary>
    Task<bool> DeleteBilliardTableAsync(int tableId, int userId, bool isAdmin = false);
    
    /// <summary>
    /// Search billiard tables by keyword
    /// </summary>
    Task<List<BilliardTableResponseDto>> SearchBilliardTablesAsync(string query);

    /// <summary>
    /// Get filtered billiard tables with type-specific params and pagination
    /// </summary>
    Task<List<BilliardTableResponseDto>> GetFilteredBilliardTablesAsync(string? tableSize, string? tableType,
        string? condition, decimal? minPrice, decimal? maxPrice, int page, int pageSize);

    /// <summary>
    /// Mark a billiard table as sold (owner only)
    /// </summary>
    Task<bool> MarkAsSoldAsync(int tableId, int userId);

    /// <summary>
    /// Get count of active (unsold) billiard tables
    /// </summary>
    Task<int> GetActiveCountAsync();
}
