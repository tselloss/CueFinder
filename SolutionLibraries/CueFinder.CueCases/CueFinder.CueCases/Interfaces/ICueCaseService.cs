using CueFinder.CueCases.Models;

namespace CueFinder.CueCases.Interfaces;

/// <summary>
/// Service interface for cue case management operations
/// </summary>
public interface ICueCaseService
{
    /// <summary>
    /// Get all cue cases with optional filtering
    /// </summary>
    Task<List<CueCaseResponseDto>> GetAllCueCasesAsync(string? condition = null, string? brand = null, 
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest");
    
    /// <summary>
    /// Get a specific cue case by ID
    /// </summary>
    Task<CueCaseResponseDto?> GetCueCaseByIdAsync(int cueCaseId);
    
    /// <summary>
    /// Get all cue cases created by a specific user
    /// </summary>
    Task<List<CueCaseResponseDto>> GetUserCueCasesAsync(int userId);
    
    /// <summary>
    /// Create a new cue case listing
    /// </summary>
    Task<CueCaseResponseDto> CreateCueCaseAsync(CreateCueCaseDto dto, int userId);
    
    /// <summary>
    /// Update an existing cue case (only by owner)
    /// </summary>
    Task<CueCaseResponseDto?> UpdateCueCaseAsync(int cueCaseId, UpdateCueCaseDto dto, int userId);
    
    /// <summary>
    /// Delete a cue case (only by owner or admin)
    /// </summary>
    Task<bool> DeleteCueCaseAsync(int cueCaseId, int userId, bool isAdmin = false);
    
    /// <summary>
    /// Search cue cases by keyword
    /// </summary>
    Task<List<CueCaseResponseDto>> SearchCueCasesAsync(string query);
}
