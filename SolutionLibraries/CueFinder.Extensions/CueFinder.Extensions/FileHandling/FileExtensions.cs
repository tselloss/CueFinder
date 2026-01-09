using Microsoft.AspNetCore.Http;
using System.Security.Cryptography;
using System.Text;

namespace CueFinder.Extensions.FileHandling;

/// <summary>
/// Extensions for file handling operations
/// </summary>
public static class FileExtensions
{
    private static readonly string[] AllowedImageExtensions = { ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp" };
    private static readonly string[] AllowedDocumentExtensions = { ".pdf", ".doc", ".docx", ".txt" };
    private const long MaxImageSize = 10 * 1024 * 1024; // 10 MB
    private const long MaxDocumentSize = 50 * 1024 * 1024; // 50 MB

    /// <summary>
    /// Validates if the file is a valid image
    /// </summary>
    public static bool IsValidImage(this IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedImageExtensions.Contains(extension))
            return false;

        if (file.Length > MaxImageSize)
            return false;

        // Check content type
        return file.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Validates if the file is a valid document
    /// </summary>
    public static bool IsValidDocument(this IFormFile file)
    {
        if (file == null || file.Length == 0)
            return false;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedDocumentExtensions.Contains(extension))
            return false;

        return file.Length <= MaxDocumentSize;
    }

    /// <summary>
    /// Validates if files collection is not empty and all are valid images
    /// </summary>
    public static bool AreValidImages(this IFormFileCollection files)
    {
        if (files == null || files.Count == 0)
            return false;

        return files.All(f => f.IsValidImage());
    }

    /// <summary>
    /// Generates a unique filename with timestamp
    /// </summary>
    public static string GenerateUniqueFileName(this IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        var timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");
        var guid = Guid.NewGuid().ToString("N").Substring(0, 8);
        return $"{timestamp}_{guid}{extension}";
    }

    /// <summary>
    /// Generates a secure filename by removing potentially dangerous characters
    /// </summary>
    public static string SanitizeFileName(this string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return "file";

        // Remove path information
        fileName = Path.GetFileName(fileName);

        // Remove invalid characters
        var invalidChars = Path.GetInvalidFileNameChars();
        var sanitized = new string(fileName.Where(c => !invalidChars.Contains(c)).ToArray());

        // Remove any remaining dangerous characters
        sanitized = sanitized.Replace("..", string.Empty)
                           .Replace("\\", string.Empty)
                           .Replace("/", string.Empty);

        return string.IsNullOrWhiteSpace(sanitized) ? "file" : sanitized;
    }

    /// <summary>
    /// Calculates MD5 hash of a file
    /// </summary>
    public static async Task<string> CalculateMD5HashAsync(this IFormFile file)
    {
        using var md5 = MD5.Create();
        using var stream = file.OpenReadStream();
        var hash = await md5.ComputeHashAsync(stream);
        return BitConverter.ToString(hash).Replace("-", string.Empty).ToLowerInvariant();
    }

    /// <summary>
    /// Saves a file to the specified directory
    /// </summary>
    public static async Task<string> SaveToDirectoryAsync(
        this IFormFile file,
        string directoryPath,
        string? fileName = null,
        CancellationToken cancellationToken = default)
    {
        // Create directory if it doesn't exist
        if (!Directory.Exists(directoryPath))
        {
            Directory.CreateDirectory(directoryPath);
        }

        // Generate filename if not provided
        fileName ??= file.GenerateUniqueFileName();
        fileName = fileName.SanitizeFileName();

        var filePath = Path.Combine(directoryPath, fileName);

        // Save file
        using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, cancellationToken);

        return fileName;
    }

    /// <summary>
    /// Gets the file size in a human-readable format
    /// </summary>
    public static string GetHumanReadableSize(this long bytes)
    {
        string[] sizes = { "B", "KB", "MB", "GB", "TB" };
        double len = bytes;
        int order = 0;

        while (len >= 1024 && order < sizes.Length - 1)
        {
            order++;
            len = len / 1024;
        }

        return $"{len:0.##} {sizes[order]}";
    }

    /// <summary>
    /// Checks if a file exists and deletes it
    /// </summary>
    public static bool DeleteIfExists(string filePath)
    {
        if (File.Exists(filePath))
        {
            try
            {
                File.Delete(filePath);
                return true;
            }
            catch
            {
                return false;
            }
        }
        return false;
    }

    /// <summary>
    /// Gets the MIME type for a file extension
    /// </summary>
    public static string GetMimeType(string fileName)
    {
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        
        return extension switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".bmp" => "image/bmp",
            ".pdf" => "application/pdf",
            ".doc" => "application/msword",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".txt" => "text/plain",
            _ => "application/octet-stream"
        };
    }

    /// <summary>
    /// Converts IFormFile to byte array
    /// </summary>
    public static async Task<byte[]> ToByteArrayAsync(this IFormFile file)
    {
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }

    /// <summary>
    /// Validates multiple files with custom validation
    /// </summary>
    public static (bool isValid, List<string> errors) ValidateFiles(
        this IFormFileCollection files,
        int maxFiles = 10,
        long maxTotalSize = 50 * 1024 * 1024)
    {
        var errors = new List<string>();

        if (files == null || files.Count == 0)
        {
            errors.Add("No files provided");
            return (false, errors);
        }

        if (files.Count > maxFiles)
        {
            errors.Add($"Maximum {maxFiles} files allowed");
        }

        var totalSize = files.Sum(f => f.Length);
        if (totalSize > maxTotalSize)
        {
            errors.Add($"Total file size exceeds maximum allowed ({maxTotalSize.GetHumanReadableSize()})");
        }

        foreach (var file in files)
        {
            if (!file.IsValidImage())
            {
                errors.Add($"File '{file.FileName}' is not a valid image");
            }
        }

        return (errors.Count == 0, errors);
    }
}
