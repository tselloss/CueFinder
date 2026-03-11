using CueFinder.CueSets.Models;

namespace CueFinder.CueSets.Interfaces;

public interface ICueSetService
{
    Task<List<CueSetResponseDto>> GetAllCueSetsAsync(string? condition = null, string? brand = null,
        decimal? minPrice = null, decimal? maxPrice = null, string sortBy = "newest");
    Task<CueSetResponseDto?> GetCueSetByIdAsync(int cueSetId);
    Task<List<CueSetResponseDto>> GetUserCueSetsAsync(int userId, bool? hidden = null);
    Task<CueSetResponseDto> CreateCueSetAsync(CreateCueSetDto dto, int userId);
    Task<CueSetResponseDto?> UpdateCueSetAsync(int cueSetId, UpdateCueSetDto dto, int userId);
    Task<bool> DeleteCueSetAsync(int cueSetId, int userId, bool isAdmin = false);
    Task<List<CueSetResponseDto>> SearchCueSetsAsync(string query);
}
