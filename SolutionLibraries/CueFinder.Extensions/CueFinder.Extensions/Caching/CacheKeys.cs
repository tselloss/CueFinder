namespace CueFinder.Extensions.Caching;

/// <summary>
/// Centralized cache key definitions
/// </summary>
public static class CacheKeys
{
    /// <summary>
    /// Cache key for user data
    /// </summary>
    public static string User(int userId) => $"user:{userId}";

    /// <summary>
    /// Cache key for user by phone number
    /// </summary>
    public static string UserByPhone(string phoneNumber) => $"user:phone:{phoneNumber}";

    /// <summary>
    /// Cache key for cue data
    /// </summary>
    public static string Cue(int cueId) => $"cue:{cueId}";

    /// <summary>
    /// Cache key for cue list
    /// </summary>
    public static string CueList(int page, int pageSize, string? filters = null) 
        => $"cue:list:{page}:{pageSize}:{filters ?? "all"}";

    /// <summary>
    /// Cache key for user's saved cues
    /// </summary>
    public static string SavedCues(int userId) => $"saved-cues:{userId}";

    /// <summary>
    /// Cache key for cue ratings
    /// </summary>
    public static string CueRating(int cueId) => $"cue:rating:{cueId}";

    /// <summary>
    /// Cache key for user's rating
    /// </summary>
    public static string UserRating(int userId, int cueId) => $"rating:{userId}:{cueId}";

    /// <summary>
    /// Cache key for cue images
    /// </summary>
    public static string CueImages(int cueId) => $"cue:images:{cueId}";

    /// <summary>
    /// Cache key for verification token
    /// </summary>
    public static string VerificationToken(string phoneNumber) => $"verification:{phoneNumber}";

    /// <summary>
    /// Pattern to clear all user-related caches
    /// </summary>
    public static string UserPattern(int userId) => $"*:{userId}*";

    /// <summary>
    /// Pattern to clear all cue-related caches
    /// </summary>
    public static string CuePattern(int cueId) => $"cue:*:{cueId}*";

    /// <summary>
    /// Pattern to clear all list caches
    /// </summary>
    public const string ListPattern = "list:*";
}
