namespace CueFinder.Models
{
    /// <summary>
    /// Configuration for image storage settings
    /// </summary>
    public class ImageStorageSettings
    {
        /// <summary>
        /// Base directory for storing uploaded images
        /// </summary>
        public string StoragePath { get; set; } = "uploads/cues";

        /// <summary>
        /// Base URL for accessing uploaded images
        /// </summary>
        public string ImageUrlBase { get; set; } = "/uploads/cues";

        /// <summary>
        /// Maximum file size in bytes (default 10MB)
        /// </summary>
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024;

        /// <summary>
        /// Allowed file extensions (comma-separated)
        /// </summary>
        public string AllowedExtensions { get; set; } = ".jpg,.jpeg,.png,.gif,.webp";

        /// <summary>
        /// Allowed MIME types (comma-separated)
        /// </summary>
        public string AllowedMimeTypes { get; set; } = "image/jpeg,image/png,image/gif,image/webp";

        /// <summary>
        /// Enable image compression
        /// </summary>
        public bool EnableCompression { get; set; } = true;

        /// <summary>
        /// Compression quality (1-100)
        /// </summary>
        public int CompressionQuality { get; set; } = 85;

        /// <summary>
        /// Generate thumbnail images
        /// </summary>
        public bool GenerateThumbnails { get; set; } = true;

        /// <summary>
        /// Thumbnail size in pixels (width x height will be square)
        /// </summary>
        public int ThumbnailSize { get; set; } = 200;

        /// <summary>
        /// Use cloud storage (Azure, AWS, etc.) instead of local
        /// </summary>
        public bool UseCloudStorage { get; set; } = false;

        /// <summary>
        /// Cloud storage connection string (if using cloud)
        /// </summary>
        public string? CloudStorageConnectionString { get; set; }

        /// <summary>
        /// Cloud storage container name
        /// </summary>
        public string? CloudStorageContainer { get; set; }
    }
}
