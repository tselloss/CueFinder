using System.Text.RegularExpressions;

namespace CueFinder.Extensions.Validation;

/// <summary>
/// Common validation extensions for the CueFinder application
/// </summary>
public static class ValidationExtensions
{
    /// <summary>
    /// Validates if a string is a valid email format
    /// </summary>
    public static bool IsValidEmail(this string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return false;

        try
        {
            var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.IgnoreCase);
            return regex.IsMatch(email);
        }
        catch
        {
            return false;
        }
    }

    /// <summary>
    /// Validates if a string is a valid phone number format
    /// </summary>
    public static bool IsValidPhoneNumber(this string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(phoneNumber))
            return false;

        // Remove common separators
        var cleaned = Regex.Replace(phoneNumber, @"[\s\-\(\)\.]", "");
        
        // Check if it starts with + and has 10-15 digits
        var regex = new Regex(@"^\+?[1-9]\d{9,14}$");
        return regex.IsMatch(cleaned);
    }

    /// <summary>
    /// Validates if a string is not null, empty, or whitespace
    /// </summary>
    public static bool IsNotNullOrEmpty(this string? value)
    {
        return !string.IsNullOrWhiteSpace(value);
    }

    /// <summary>
    /// Validates if a value is within a specified range
    /// </summary>
    public static bool IsInRange<T>(this T value, T min, T max) where T : IComparable<T>
    {
        return value.CompareTo(min) >= 0 && value.CompareTo(max) <= 0;
    }

    /// <summary>
    /// Validates if a collection is not null and not empty
    /// </summary>
    public static bool IsNotNullOrEmpty<T>(this IEnumerable<T>? collection)
    {
        return collection != null && collection.Any();
    }

    /// <summary>
    /// Validates if a string meets minimum and maximum length requirements
    /// </summary>
    public static bool HasValidLength(this string? value, int minLength, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return value.Length >= minLength && value.Length <= maxLength;
    }

    /// <summary>
    /// Validates if a string contains only alphanumeric characters
    /// </summary>
    public static bool IsAlphanumeric(this string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return Regex.IsMatch(value, @"^[a-zA-Z0-9]+$");
    }

    /// <summary>
    /// Validates if a string is a valid URL
    /// </summary>
    public static bool IsValidUrl(this string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            return false;

        return Uri.TryCreate(url, UriKind.Absolute, out var uriResult)
               && (uriResult.Scheme == Uri.UriSchemeHttp || uriResult.Scheme == Uri.UriSchemeHttps);
    }

    /// <summary>
    /// Validates if a price is valid (positive and has max 2 decimal places)
    /// </summary>
    public static bool IsValidPrice(this decimal price)
    {
        return price > 0 && Math.Round(price, 2) == price;
    }

    /// <summary>
    /// Validates if a GUID string is valid
    /// </summary>
    public static bool IsValidGuid(this string? guidString)
    {
        if (string.IsNullOrWhiteSpace(guidString))
            return false;

        return Guid.TryParse(guidString, out _);
    }

    /// <summary>
    /// Validates if a date is not in the future
    /// </summary>
    public static bool IsNotFutureDate(this DateTime date)
    {
        return date <= DateTime.UtcNow;
    }

    /// <summary>
    /// Validates if a date is within a specific age range
    /// </summary>
    public static bool IsAgeInRange(this DateTime birthDate, int minAge, int maxAge)
    {
        var today = DateTime.Today;
        var age = today.Year - birthDate.Year;
        
        if (birthDate.Date > today.AddYears(-age))
            age--;

        return age >= minAge && age <= maxAge;
    }

    /// <summary>
    /// Validates if a file extension is allowed
    /// </summary>
    public static bool HasAllowedExtension(this string fileName, params string[] allowedExtensions)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            return false;

        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        return allowedExtensions.Any(ext => ext.ToLowerInvariant() == extension);
    }

    /// <summary>
    /// Validates if a file size is within the allowed limit
    /// </summary>
    public static bool IsWithinSizeLimit(this long fileSize, long maxSizeInBytes)
    {
        return fileSize > 0 && fileSize <= maxSizeInBytes;
    }

    /// <summary>
    /// Sanitizes a string by removing potentially dangerous characters
    /// </summary>
    public static string Sanitize(this string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        // Remove any HTML tags
        var withoutHtml = Regex.Replace(input, @"<[^>]*>", string.Empty);
        
        // Remove script tags and content
        withoutHtml = Regex.Replace(withoutHtml, @"<script[^>]*>.*?</script>", string.Empty, RegexOptions.IgnoreCase | RegexOptions.Singleline);
        
        return withoutHtml.Trim();
    }

    /// <summary>
    /// Validates if pagination parameters are valid
    /// </summary>
    public static bool AreValidPaginationParams(int page, int pageSize, int maxPageSize = 100)
    {
        return page > 0 && pageSize > 0 && pageSize <= maxPageSize;
    }
}
