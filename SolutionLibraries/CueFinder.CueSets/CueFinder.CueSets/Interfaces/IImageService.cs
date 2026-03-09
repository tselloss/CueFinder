using CueFinder.CueSets.Models;
using Microsoft.AspNetCore.Http;

namespace CueFinder.CueSets.Interfaces;

public interface IImageService
{
    Task<List<CueSetImageDto>> UploadImagesAsync(int cueSetId, List<IFormFile> files, int userId);
    Task<bool> DeleteImageAsync(int imageId, int userId);
    Task<bool> SetPrimaryImageAsync(int imageId, int cueSetId, int userId);
    Task<List<CueSetImageDto>> GetCueSetImagesAsync(int cueSetId);
    Task DeleteCueSetImagesInternalAsync(int cueSetId);
}
