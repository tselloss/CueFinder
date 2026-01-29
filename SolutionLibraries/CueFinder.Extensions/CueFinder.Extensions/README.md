# CueFinder.Extensions

A comprehensive extension library for the CueFinder application providing reusable functionality across all modules.

## Features

### 1. ProblemDetails Extensions
Standardized error handling with RFC 7807 ProblemDetails responses:
- Validation errors
- Not Found errors
- Unauthorized/Forbidden errors
- Conflict errors
- Internal Server errors
- Service Unavailable errors

### 2. Validation Extensions
Common validation patterns:
- Email validation
- Phone number validation
- String length validation
- URL validation
- Price validation
- GUID validation
- Date validation
- File extension/size validation
- Input sanitization

### 3. Response Extensions
Standardized API response wrappers:
- `ApiResponse<T>` for single items
- `PaginatedApiResponse<T>` for lists with pagination metadata

### 4. Controller Extensions
Helper methods for controllers:
- Extract user information from claims (ID, email, name, roles)
- Create standardized responses (Ok, Created, Error responses)
- Model state validation
- ProblemDetails creation shortcuts

### 5. Authentication Extensions
JWT token management:
- JWT Bearer authentication configuration
- Token generation
- Token validation
- Extract claims from tokens
- Check token expiration

### 6. Pagination Extensions
Pagination helpers:
- Apply pagination to IQueryable/IEnumerable
- Create paginated results with metadata
- Validate pagination parameters
- Calculate total pages

### 7. File Handling Extensions
File upload and management:
- Validate image files
- Validate document files
- Generate unique filenames
- Sanitize filenames
- Calculate file hashes
- Save files to directory
- Get human-readable file sizes
- MIME type detection

### 8. Logging Extensions
Structured logging helpers:
- Log method entry/exit
- Log execution time
- Log user actions
- Log security events
- Log database operations
- Log external API calls
- Log cache operations
- Log validation errors
- Log business rule violations

### 9. Caching Extensions
Advanced caching functionality (existing):
- Memory cache service
- Cache attributes for methods
- Cache invalidation
- Cache statistics

### 10. Email Services
Email sending functionality with multiple implementations:
- **SMTP Email Service**: Traditional SMTP-based email sending
- **Gmail API Email Service**: Google Gmail API v1 integration for sending emails

## Installation

Add reference to CueFinder.Extensions in your project:

```xml
<ProjectReference Include="..\CueFinder.Extensions\CueFinder.Extensions.csproj" />
```

## Usage

### In Program.cs

```csharp
using CueFinder.Extensions;
using CueFinder.Extensions.ProblemDetails;
using CueFinder.Extensions.Authentication;
using CueFinder.Extensions.Caching;

var builder = WebApplication.CreateBuilder(args);

// Add all extensions at once
builder.Services.AddCueFinderExtensions(builder.Configuration, includeExceptionDetails: builder.Environment.IsDevelopment());

// Or add individually
builder.Services.AddCueFinderProblemDetails(includeExceptionDetails: builder.Environment.IsDevelopment());
builder.Services.AddCueFinderJwtAuthentication(builder.Configuration);
builder.Services.AddCueFinderCaching(builder.Configuration);
```

### In Controllers

```csharp
using CueFinder.Extensions.Controllers;
using CueFinder.Extensions.Validation;
using CueFinder.Extensions.Pagination;

[ApiController]
[Route("api/[controller]")]
public class CuesController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetCues(int page = 1, int pageSize = 10)
    {
        // Validate pagination
        if (!ValidationExtensions.AreValidPaginationParams(page, pageSize))
        {
            return this.BadRequestProblem("Invalid Parameters", "Page and pageSize must be positive");
        }

        // Get user ID from token
        var userId = User.GetUserIdOrThrow();

        // Get paginated data
        var cues = await _cueService.GetCuesAsync();
        var paginatedResult = cues.ToPaginatedResult(page, pageSize, totalCount);

        return this.OkPaginated(paginatedResult.Items, page, pageSize, totalCount);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCue(int id)
    {
        var cue = await _cueService.GetByIdAsync(id);
        if (cue == null)
        {
            return this.NotFoundProblem("Cue Not Found", $"Cue with ID {id} was not found");
        }

        return this.Ok(cue, "Cue retrieved successfully");
    }

    [HttpPost]
    public async Task<IActionResult> CreateCue([FromBody] CreateCueRequest request)
    {
        // Validate model state
        var validationError = this.ValidateModelState();
        if (validationError != null) return validationError;

        // Additional validation
        if (!request.Price.IsValidPrice())
        {
            return this.BadRequestProblem("Invalid Price", "Price must be positive with max 2 decimal places");
        }

        var userId = User.GetUserIdOrThrow();
        var cue = await _cueService.CreateAsync(request, userId);

        return this.Created(nameof(GetCue), new { id = cue.Id }, cue, "Cue created successfully");
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadImages([FromForm] IFormFileCollection files)
    {
        // Validate files
        var (isValid, errors) = files.ValidateFiles(maxFiles: 5, maxTotalSize: 20 * 1024 * 1024);
        if (!isValid)
        {
            return this.BadRequestProblem("Invalid Files", string.Join(", ", errors));
        }

        // Process files
        var uploadedFiles = new List<string>();
        foreach (var file in files)
        {
            var fileName = await file.SaveToDirectoryAsync("wwwroot/uploads");
            uploadedFiles.Add(fileName);
        }

        return this.Ok(uploadedFiles, "Files uploaded successfully");
    }
}
```

### In Services

```csharp
using CueFinder.Extensions.Logging;
using CueFinder.Extensions.Caching;

public class CueService : ICueService
{
    private readonly ILogger<CueService> _logger;
    private readonly ICacheService _cache;

    public async Task<Cue?> GetByIdAsync(int id)
    {
        _logger.LogMethodEntry(nameof(GetByIdAsync), new { id });

        return await _logger.LogExecutionTimeAsync(
            nameof(GetByIdAsync),
            async () =>
            {
                // Try get from cache
                var cacheKey = CacheKeys.Cue(id);
                var cached = await _cache.GetAsync<Cue>(cacheKey);
                if (cached != null)
                {
                    _logger.LogCacheOperation("Hit", cacheKey);
                    return cached;
                }

                _logger.LogCacheOperation("Miss", cacheKey);
                _logger.LogDatabaseOperation("SELECT", "Cue", new { id });

                var cue = await _repository.GetByIdAsync(id);
                
                if (cue != null)
                {
                    await _cache.SetAsync(cacheKey, cue, TimeSpan.FromMinutes(10));
                }

                _logger.LogMethodExit(nameof(GetByIdAsync), new { found = cue != null });
                return cue;
            });
    }

    public async Task<Cue> CreateAsync(CreateCueRequest request, int userId)
    {
        _logger.LogUserAction(userId, "CreateCue", request);

        // Validate
        if (!request.Title.IsNotNullOrEmpty())
        {
            _logger.LogValidationError("Title", "Title is required");
            throw new ArgumentException("Title is required");
        }

        // Create cue
        var cue = new Cue
        {
            Title = request.Title.Sanitize(),
            Price = request.Price,
            UserId = userId
        };

        await _repository.AddAsync(cue);
        
        // Invalidate cache
        await _cache.RemoveAsync(CacheKeys.CuesList);

        return cue;
    }
}
```

## Configuration

### appsettings.json

```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-here-min-32-characters",
    "Issuer": "CueFinder",
    "Audience": "CueFinderAPI",
    "ExpirationMinutes": 60
  },
  "CacheSettings": {
    "DefaultExpirationMinutes": 10,
    "SlidingExpirationMinutes": 5,
    "MaxCacheSize": 1000,
    "EnableStatistics": true
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "FromEmail": "your-email@gmail.com",
    "FromName": "CueFinder Admin",
    "SmtpPassword": "your-app-password",
    "EnableSsl": true
  },
  "GmailApiSettings": {
    "ServiceAccountCredentialsJson": "",
    "ServiceAccountCredentialsPath": "/path/to/service-account-key.json",
    "FromEmail": "admin@yourdomain.com",
    "FromName": "CueFinder Admin",
    "ImpersonateUser": "admin@yourdomain.com",
    "ApplicationName": "CueFinder"
  }
}
```

**Note:** For `GmailApiSettings`, use **either** `ServiceAccountCredentialsJson` (JSON string) **or** `ServiceAccountCredentialsPath` (file path), not both.

**Option 1 - Using JSON String:**
```json
"GmailApiSettings": {
  "ServiceAccountCredentialsJson": "{\"type\":\"service_account\",\"project_id\":\"your-project\",\"private_key_id\":\"...\"}",
  "FromEmail": "admin@yourdomain.com"
}
```

**Option 2 - Using File Path:**
```json
"GmailApiSettings": {
  "ServiceAccountCredentialsPath": "/path/to/service-account-key.json",
  "FromEmail": "admin@yourdomain.com"
}
```

### Email Service Setup

#### Using SMTP Email Service

```csharp
// In Program.cs
using CueFinder.Extensions.Email;

builder.Services.AddEmailService(builder.Configuration);
```

#### Using Gmail API Email Service

```csharp
// In Program.cs
using CueFinder.Extensions.Email;

builder.Services.AddGmailApiEmailService(builder.Configuration);
```

**Gmail API Setup Requirements:**
1. Create a Google Cloud Project
2. Enable Gmail API
3. Create a Service Account with domain-wide delegation (for Google Workspace)
4. Download the service account JSON key
5. Configure the JSON key in `ServiceAccountCredentialsJson` or save it to a file and set `ServiceAccountCredentialsPath`
6. If using domain-wide delegation, set `ImpersonateUser` to the email address to send from

#### Using Email Service in Code

```csharp
public class NotificationService
{
    private readonly IEmailService _emailService;
    
    public NotificationService(IEmailService emailService)
    {
        _emailService = emailService;
    }
    
    public async Task SendWelcomeEmailAsync(string userEmail, string userName)
    {
        var subject = "Welcome to CueFinder!";
        var body = $"<h1>Welcome {userName}!</h1><p>Thank you for joining CueFinder.</p>";
        
        await _emailService.SendAsync(userEmail, subject, body, isHtml: true);
    }
    
    public async Task SendBulkNotificationAsync(List<string> recipients, string subject, string message)
    {
        await _emailService.SendBatchAsync(recipients, subject, message, isHtml: true);
    }
}
```

## Best Practices

1. **Always use ProblemDetails for errors** - Provides standardized error responses
2. **Validate early** - Use validation extensions at the controller level
3. **Log consistently** - Use logging extensions for structured logs
4. **Cache smartly** - Use caching for expensive operations
5. **Sanitize inputs** - Always sanitize user inputs before processing
6. **Use pagination** - For list endpoints, always use pagination

## Testing

All extensions are designed to be testable and mockable. Use dependency injection for services that depend on these extensions.
