using CueFinder.Accessories.Models;

namespace CueFinder.Accessories.Interfaces;

/// <summary>
/// Service interface for accessory management operations
/// </summary>
public interface IAccessoryService
{
    /// <summary>
    /// Get all accessories with optional filtering
    /// </summary>
    Task<List<AccessoryResponseDto>> GetAllAccessoriesAsync(string? condition = null, string? brand = null, 
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest");
    
    /// <summary>
    /// Get a specific accessory by ID
    /// </summary>
    Task<AccessoryResponseDto?> GetAccessoryByIdAsync(int accessoryId);
    
    /// <summary>
    /// Get all accessories created by a specific user
    /// </summary>
    Task<List<AccessoryResponseDto>> GetUserAccessoriesAsync(int userId, bool? hidden = null);
    
    /// <summary>
    /// Create a new accessory listing
    /// </summary>
    Task<AccessoryResponseDto> CreateAccessoryAsync(CreateAccessoryDto dto, int userId);
    
    /// <summary>
    /// Update an existing accessory (only by owner)
    /// </summary>
    Task<AccessoryResponseDto?> UpdateAccessoryAsync(int accessoryId, UpdateAccessoryDto dto, int userId);
    
    /// <summary>
    /// Delete an accessory (only by owner or admin)
    /// </summary>
    Task<bool> DeleteAccessoryAsync(int accessoryId, int userId, bool isAdmin = false);
    
    /// <summary>
    /// Search accessories by keyword
    /// </summary>
    Task<List<AccessoryResponseDto>> SearchAccessoriesAsync(string query);
}
