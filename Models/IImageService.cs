namespace CueFinder.Models
{
    /// <summary>
    /// Interface for image upload and storage operations
    /// </summary>
    public interface IImageService
    {
        /// <summary>
        /// Upload a single image for a cue
        /// </summary>
        Task<ImageUploadResponse> UploadImageAsync(ImageUploadRequest request, int userId);

        /// <summary>
        /// Upload multiple images at once
        /// </summary>
        Task<List<ImageUploadResponse>> UploadMultipleImagesAsync(List<IFormFile> files, int cueId, int userId);

        /// <summary>
        /// Delete an image from storage and database
        /// </summary>
        Task<bool> DeleteImageAsync(int imageId, int userId);

        /// <summary>
        /// Get image by ID
        /// </summary>
        Task<CueImage?> GetImageAsync(int imageId);

        /// <summary>
        /// Get all images for a cue
        /// </summary>
        Task<List<CueImage>> GetCueImagesAsync(int cueId);

        /// <summary>
        /// Set primary/thumbnail image for a cue
        /// </summary>
        Task<bool> SetPrimaryImageAsync(int imageId, int userId);

        /// <summary>
        /// Update image display order
        /// </summary>
        Task<bool> UpdateImageOrderAsync(int imageId, int newOrder);

        /// <summary>
        /// Delete all images for a cue
        /// </summary>
        Task<bool> DeleteCueImagesAsync(int cueId, int userId);

        /// <summary>
        /// Validate image file before upload
        /// </summary>
        Task<(bool IsValid, string? ErrorMessage)> ValidateImageAsync(IFormFile file);

        /// <summary>
        /// Get image URL for public access
        /// </summary>
        string GetImageUrl(string fileName);
    }
}
