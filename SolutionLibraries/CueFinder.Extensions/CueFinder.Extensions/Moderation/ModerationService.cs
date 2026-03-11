using System.Security.Cryptography;
using System.Text;
using CueFinder.Database.Context;
using CueFinder.Database.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace CueFinder.Extensions.Moderation
{
    /// <summary>
    /// Service for managing image moderation workflow
    /// </summary>
    public interface IModerationService
    {
        /// <summary>
        /// Scan image and return moderation result
        /// </summary>
        Task<ModerationResult> ScanImageAsync(string imagePath, int userId, int? cueId = null, int? cueCaseId = null);

        /// <summary>
        /// Check if image hash is already flagged
        /// </summary>
        Task<FlaggedImage?> CheckImageHashAsync(string imageHash);

        /// <summary>
        /// Get pending moderation items
        /// </summary>
        Task<List<FlaggedImage>> GetPendingFlagsAsync(int limit = 50);

        /// <summary>
        /// Approve flagged image and move to public storage
        /// </summary>
        Task<bool> ApproveFlagAsync(int flagId, int adminUserId, string notes = "");

        /// <summary>
        /// Reject flagged image and ban user if necessary
        /// </summary>
        Task<bool> RejectFlagAsync(int flagId, int adminUserId, string notes = "", bool banUser = false);

        /// <summary>
        /// Move image from temporary to public storage
        /// </summary>
        Task<string> MoveToPublicStorageAsync(string tempPath, int cueId, string filename);

        /// <summary>
        /// Generate perceptual hash for image
        /// </summary>
        string GenerateImageHash(string imagePath);

        /// <summary>
        /// Check for similar images using hash
        /// </summary>
        Task<List<FlaggedImage>> CheckSimilarImagesAsync(string imageHash, int tolerance = 5);
    }

    /// <summary>
    /// Result from image moderation scanning
    /// </summary>
    public class ModerationResult
    {
        public bool IsUnsafe { get; set; }
        public string FlagReason { get; set; } = "none";
        public double ConfidenceScore { get; set; } = 0.0;
        public string? ErrorMessage { get; set; }
    }

    public class ModerationService : IModerationService
    {
        private readonly CueFinderDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<ModerationService> _logger;
        private readonly string _nudenetUrl;
        private readonly IConfiguration _configuration;

        public ModerationService(
            CueFinderDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<ModerationService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
            _configuration = configuration;
            _nudenetUrl = configuration["Moderation:NudeNetUrl"] ?? "http://localhost:8001";
        }

        /// <summary>
        /// Scan image against AI moderation service
        /// </summary>
        public async Task<ModerationResult> ScanImageAsync(string imagePath, int userId, int? cueId = null, int? cueCaseId = null)
        {
            if (_configuration.GetValue<bool>("Moderation:Disabled"))
            {
                _logger.LogInformation("Moderation disabled; skipping scan for {ImagePath}", imagePath);
                return new ModerationResult { IsUnsafe = false };
            }

            if (!File.Exists(imagePath))
            {
                _logger.LogWarning($"Image file not found: {imagePath}");
                return new ModerationResult
                {
                    IsUnsafe = true,
                    ErrorMessage = "File not found",
                    FlagReason = "file_error"
                };
            }

            try
            {
                // Generate hash for duplicate detection
                var imageHash = GenerateImageHash(imagePath);

                // Check if hash already flagged
                var existingFlag = await CheckImageHashAsync(imageHash);
                if (existingFlag != null && existingFlag.Status == "rejected")
                {
                    _logger.LogInformation($"Image hash previously rejected: {imageHash}");
                    return new ModerationResult
                    {
                        IsUnsafe = true,
                        FlagReason = "duplicate_rejected",
                        ConfidenceScore = 1.0
                    };
                }

                // Call NudeNet AI service
                var aiResult = await ScanWithNudeNetAsync(imagePath);

                if (aiResult.IsUnsafe)
                {
                    // Flag and add to moderation queue
                    _logger.LogWarning(
                        "Flagging image for user {UserId}: {ImagePath}, Reason: {Reason}, Score: {Score}, CueId: {CueId}, CueCaseId: {CueCaseId}",
                        userId, imagePath, aiResult.FlagReason, aiResult.ConfidenceScore, cueId, cueCaseId);

                    // Ensure file is retained for admin review (move to a flagged folder when coming from temp paths)
                    try
                    {
                        var sourceDir = Path.GetDirectoryName(imagePath) ?? string.Empty;
                        // If image is under uploads\\temp, move to uploads\\flagged
                        if (sourceDir.EndsWith(Path.Combine("uploads", "temp"), StringComparison.OrdinalIgnoreCase))
                        {
                            var uploadsRoot = Path.GetDirectoryName(sourceDir) ?? string.Empty; // .../uploads
                            var flaggedDir = Path.Combine(uploadsRoot, "flagged");
                            Directory.CreateDirectory(flaggedDir);
                            var flaggedPath = Path.Combine(flaggedDir, Path.GetFileName(imagePath));
                            if (System.IO.File.Exists(imagePath))
                            {
                                System.IO.File.Move(imagePath, flaggedPath, overwrite: true);
                                imagePath = flaggedPath;
                            }
                        }
                    }
                    catch (Exception moveEx)
                    {
                        _logger.LogWarning(moveEx, "Unable to move flagged file to flagged folder: {ImagePath}", imagePath);
                    }

                    var flaggedImage = new FlaggedImage
                    {
                        ImageHash = imageHash,
                        FileName = Path.GetFileName(imagePath),
                        StoragePath = imagePath,
                        CueId = cueId,
                        CueCaseId = cueCaseId,
                        UserId = userId,
                        FlagReason = aiResult.FlagReason,
                        AIConfidenceScore = aiResult.ConfidenceScore,
                        IsAIFlagged = true,
                        Status = "pending"
                    };

                    _context.FlaggedImages.Add(flaggedImage);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation(
                        "Image flagged and saved to database: FlagId={FlagId}, UserId={UserId}, ImageHash={ImageHash}",
                        flaggedImage.Id, flaggedImage.UserId, imageHash);

                    // Add to moderation queue
                    var priority = aiResult.ConfidenceScore > 0.85 ? 1 : aiResult.ConfidenceScore > 0.7 ? 2 : 3;
                    var queueItem = new ModerationQueue
                    {
                        FlaggedImageId = flaggedImage.Id,
                        Priority = priority,
                        UserReportCount = 0
                    };

                    _context.ModerationQueues.Add(queueItem);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation($"Image flagged for moderation: {flaggedImage.Id}, Reason: {aiResult.FlagReason}, Score: {aiResult.ConfidenceScore}");
                }

                return aiResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error scanning image: {imagePath}");
                return new ModerationResult
                {
                    IsUnsafe = true,
                    ErrorMessage = "Scan error",
                    FlagReason = "scan_error"
                };
            }
        }

        /// <summary>
        /// Call NudeNet microservice for image scanning
        /// </summary>
        private async Task<ModerationResult> ScanWithNudeNetAsync(string imagePath)
        {
            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.Timeout = TimeSpan.FromSeconds(30);

                using var form = new MultipartFormDataContent();
                using var fileStream = File.OpenRead(imagePath);
                form.Add(new StreamContent(fileStream), "file", Path.GetFileName(imagePath));

                var response = await client.PostAsync($"{_nudenetUrl}/scan", form);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning($"NudeNet service returned {response.StatusCode}");
                    return new ModerationResult
                    {
                        IsUnsafe = true,
                        FlagReason = "service_error",
                        ConfidenceScore = 1.0
                    }; // Fail closed
                }

                var content = await response.Content.ReadAsStringAsync();
                var jsonDoc = System.Text.Json.JsonDocument.Parse(content);

                var unsafe_value = jsonDoc.RootElement.GetProperty("unsafe").GetBoolean();
                var scores = jsonDoc.RootElement.GetProperty("scores").EnumerateObject();

                var result = new ModerationResult { IsUnsafe = unsafe_value };

                if (unsafe_value)
                {
                    var maxScore = 0.0;
                    var maxCategory = "other";

                    foreach (var score in scores)
                    {
                        var value = score.Value.GetDouble();
                        if (value > maxScore)
                        {
                            maxScore = value;
                            maxCategory = score.Name;
                        }
                    }

                    result.FlagReason = maxCategory;
                    result.ConfidenceScore = maxScore;
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "NudeNet service call failed, blocking upload");
                return new ModerationResult
                {
                    IsUnsafe = true,
                    FlagReason = "scan_error",
                    ConfidenceScore = 1.0
                }; // Fail closed
            }
        }

        /// <summary>
        /// Generate perceptual hash for image
        /// </summary>
        public string GenerateImageHash(string imagePath)
        {
            // Simple hash approach - in production, use pHash or dHash
            // This is a placeholder using file hash
            using var md5 = MD5.Create();
            using var stream = File.OpenRead(imagePath);
            var hash = md5.ComputeHash(stream);
            return Convert.ToHexString(hash);
        }

        /// <summary>
        /// Check if image hash is already flagged
        /// </summary>
        public async Task<FlaggedImage?> CheckImageHashAsync(string imageHash)
        {
            return await _context.FlaggedImages
                .FirstOrDefaultAsync(f => f.ImageHash == imageHash);
        }

        /// <summary>
        /// Check for similar images using hamming distance
        /// </summary>
        public async Task<List<FlaggedImage>> CheckSimilarImagesAsync(string imageHash, int tolerance = 5)
        {
            var allHashes = await _context.FlaggedImages
                .Where(f => f.Status == "rejected")
                .Select(f => f.ImageHash)
                .ToListAsync();

            var similar = new List<FlaggedImage>();

            foreach (var hash in allHashes)
            {
                if (HammingDistance(imageHash, hash) <= tolerance)
                {
                    var flag = await _context.FlaggedImages
                        .FirstAsync(f => f.ImageHash == hash);
                    similar.Add(flag);
                }
            }

            return similar;
        }

        /// <summary>
        /// Calculate hamming distance between two hashes
        /// </summary>
        private int HammingDistance(string hash1, string hash2)
        {
            if (hash1.Length != hash2.Length) return int.MaxValue;

            var distance = 0;
            for (int i = 0; i < hash1.Length; i++)
            {
                if (hash1[i] != hash2[i]) distance++;
            }

            return distance;
        }

        /// <summary>
        /// Get pending flags for admin review
        /// </summary>
        public async Task<List<FlaggedImage>> GetPendingFlagsAsync(int limit = 50)
        {
            return await _context.FlaggedImages
                .Where(f => f.Status == "pending")
                .OrderByDescending(f => f.FlaggedAt)
                .Take(limit)
                .Include(f => f.User)
                .ToListAsync();
        }

        /// <summary>
        /// Approve flag and move image to public storage
        /// </summary>
        public async Task<bool> ApproveFlagAsync(int flagId, int adminUserId, string notes = "")
        {
            var flag = await _context.FlaggedImages.FindAsync(flagId);
            if (flag == null) return false;

            flag.Status = "approved";
            flag.AdminUserId = adminUserId;
            flag.AdminNotes = notes;
            flag.ReviewedAt = DateTime.UtcNow;

            // Remove from moderation queue
            var queueItem = await _context.ModerationQueues
                .FirstOrDefaultAsync(q => q.FlaggedImageId == flagId);
            if (queueItem != null)
            {
                _context.ModerationQueues.Remove(queueItem);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Flag {flagId} approved by admin {adminUserId}");

            // Move flagged image to public storage and attach to cue/case so it becomes visible
            try
            {
                var imageUrlBase = _configuration["ImageStorage:ImageUrlBase"] ?? "/uploads/cues";
                var storagePath = _configuration["ImageStorage:StoragePath"] ?? "uploads/cues";

                if (flag.CueId.HasValue && File.Exists(flag.StoragePath))
                {
                    // Move file from flagged folder to public cues storage
                    var publicCueFolder = Path.Combine(storagePath, flag.CueId.Value.ToString());
                    Directory.CreateDirectory(publicCueFolder);

                    var newFilePath = Path.Combine(publicCueFolder, flag.FileName);
                    if (File.Exists(flag.StoragePath))
                    {
                        File.Move(flag.StoragePath, newFilePath, overwrite: true);
                        _logger.LogInformation("Moved approved image from {OldPath} to {NewPath}", flag.StoragePath, newFilePath);
                    }

                    var publicImageUrl = $"{imageUrlBase}/{flag.CueId.Value}/{flag.FileName}";
                    var cueImage = new CueImage
                    {
                        CueId = flag.CueId.Value,
                        ImageUrl = publicImageUrl,
                        AltText = $"Cue image {flag.FileName}",
                        DisplayOrder = 0,
                        IsPrimary = false,
                        UploadedAt = DateTime.UtcNow,
                        ContentType = GuessContentType(flag.FileName)
                    };
                    _context.CueImages.Add(cueImage);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Attached approved image to Cue {CueId}: {ImageUrl}", flag.CueId.Value, publicImageUrl);
                }
                else if (flag.CueCaseId.HasValue && File.Exists(flag.StoragePath))
                {
                    // Move file from flagged folder to public cases storage
                    var publicCaseFolder = Path.Combine("uploads/cases", flag.CueCaseId.Value.ToString());
                    Directory.CreateDirectory(publicCaseFolder);

                    var newFilePath = Path.Combine(publicCaseFolder, flag.FileName);
                    if (File.Exists(flag.StoragePath))
                    {
                        File.Move(flag.StoragePath, newFilePath, overwrite: true);
                        _logger.LogInformation("Moved approved image from {OldPath} to {NewPath}", flag.StoragePath, newFilePath);
                    }

                    var publicImageUrl = $"/uploads/cases/{flag.CueCaseId.Value}/{flag.FileName}";
                    var caseImage = new CueCaseImage
                    {
                        CueCaseId = flag.CueCaseId.Value,
                        ImageUrl = publicImageUrl,
                        DisplayOrder = 0,
                        IsPrimary = false,
                        UploadedAt = DateTime.UtcNow
                    };
                    _context.CueCaseImages.Add(caseImage);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Attached approved image to CueCase {CueCaseId}: {ImageUrl}", flag.CueCaseId.Value, publicImageUrl);
                }
            }
            catch (Exception attachEx)
            {
                _logger.LogError(attachEx, "Error attaching approved image for flag {FlagId}", flagId);
            }

            return true;
        }

        /// <summary>
        /// Reject flag and optionally ban user
        /// </summary>
        public async Task<bool> RejectFlagAsync(int flagId, int adminUserId, string notes = "", bool banUser = false)
        {
            var flag = await _context.FlaggedImages
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => f.Id == flagId);
            if (flag == null) return false;

            flag.Status = "rejected";
            flag.AdminUserId = adminUserId;
            flag.AdminNotes = notes;
            flag.ReviewedAt = DateTime.UtcNow;

            // Ban user if requested
            if (banUser && flag.User != null)
            {
                flag.User.IsBanned = true;
                flag.User.BanReason = $"Image violation: {flag.FlagReason}";
                flag.User.BannedAt = DateTime.UtcNow;
                _logger.LogWarning($"User {flag.UserId} banned for flag {flagId}");
            }

            // Delete the physical file
            try
            {
                if (File.Exists(flag.StoragePath))
                    File.Delete(flag.StoragePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting file: {flag.StoragePath}");
            }

            // Remove from moderation queue
            var queueItem = await _context.ModerationQueues
                .FirstOrDefaultAsync(q => q.FlaggedImageId == flagId);
            if (queueItem != null)
            {
                _context.ModerationQueues.Remove(queueItem);
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation($"Flag {flagId} rejected by admin {adminUserId}");

            return true;
        }

        /// <summary>
        /// Move image from temp storage to public storage (not implemented - custom per setup)
        /// </summary>
        public Task<string> MoveToPublicStorageAsync(string tempPath, int cueId, string filename)
        {
            // This is a placeholder - implement based on your storage solution
            // Could be local file system, S3, Azure Blob, etc.
            throw new NotImplementedException("Implement based on your storage solution");
        }

        private string? GuessContentType(string fileName)
        {
            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            return ext switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                _ => null
            };
        }
    }
}
