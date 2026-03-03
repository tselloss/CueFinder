using CueFinder.Cues.Models;

namespace CueFinder.Cues.Interfaces;

/// <summary>
/// Service interface for cue management operations
/// </summary>
public interface ICueService
{
    /// <summary>
    /// Get all cues with optional filtering
    /// </summary>
    Task<List<CueResponseDto>> GetAllCuesAsync(string? condition = null, string? brand = null, 
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest");
    
    /// <summary>
    /// Get a specific cue by ID
    /// </summary>
    Task<CueResponseDto?> GetCueByIdAsync(int cueId);
    
    /// <summary>
    /// Get all cues created by a specific user
    /// </summary>
    Task<List<CueResponseDto>> GetUserCuesAsync(int userId, bool? hidden = null);
    
    /// <summary>
    /// Create a new cue listing
    /// </summary>
    Task<CueResponseDto> CreateCueAsync(CreateCueDto dto, int userId);
    
    /// <summary>
    /// Update an existing cue (only by owner)
    /// </summary>
    Task<CueResponseDto?> UpdateCueAsync(int cueId, UpdateCueDto dto, int userId);
    
    /// <summary>
    /// Delete a cue (only by owner or admin)
    /// </summary>
    Task<bool> DeleteCueAsync(int cueId, int userId, bool isAdmin = false);
    
    /// <summary>
    /// Search cues by keyword
    /// </summary>
    Task<List<CueResponseDto>> SearchCuesAsync(string query);
}
