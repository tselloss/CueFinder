# CueFinder.Extensions - Quick Reference Guide

## Installation

```xml
<ProjectReference Include="..\SolutionLibraries\CueFinder.Extensions\CueFinder.Extensions\CueFinder.Extensions.csproj" />
```

## Setup in Program.cs

```csharp
using CueFinder.Extensions.ProblemDetails;

// Add ProblemDetails support
builder.Services.AddCueFinderProblemDetails(
    includeExceptionDetails: builder.Environment.IsDevelopment());

// Enable exception handler and status code pages
app.UseExceptionHandler();
app.UseStatusCodePages();
```

## Controller Extension Methods

### User Information
```csharp
using CueFinder.Extensions.Controllers;

var userId = User.GetUserId();              // int?
var userId = User.GetUserIdOrThrow();       // int (throws if not found)
var email = User.GetUserEmail();            // string?
var name = User.GetUserName();              // string?
var isAdmin = User.HasRole("Admin");        // bool
```

### Success Responses
```csharp
return this.Ok(data);                                    // OkObjectResult
return this.Ok(data, "Success message");                 // OkObjectResult with message
return this.Created(actionName, routeValues, data);      // CreatedAtActionResult
return this.OkPaginated(items, page, pageSize, total);   // Paginated response
```

### Error Responses (ProblemDetails)
```csharp
return this.BadRequestProblem("Title", "Detail message");
return this.BadRequestProblem("Title", "Detail", errors);  // With validation errors
return this.NotFoundProblem("Not Found", "Resource not found");
return this.UnauthorizedProblem();
return this.UnauthorizedProblem("Title", "Detail");
return this.ForbiddenProblem();
return this.ForbiddenProblem("Access Denied", "Detail");
return this.ConflictProblem("Conflict", "Detail");
return this.InternalServerErrorProblem();
return this.InternalServerErrorProblem("Detail", includeException, ex);
```

### Model Validation
```csharp
var validationError = this.ValidateModelState();
if (validationError != null) return validationError;
```

## Validation Extensions

```csharp
using CueFinder.Extensions.Validation;

// String validation
email.IsValidEmail()                          // bool
phone.IsValidPhoneNumber()                    // bool
str.IsNotNullOrEmpty()                        // bool
str.HasValidLength(min, max)                  // bool
str.IsAlphanumeric()                          // bool
url.IsValidUrl()                              // bool
guid.IsValidGuid()                            // bool
input.Sanitize()                              // string (removes HTML/scripts)

// Number validation
price.IsValidPrice()                          // bool (positive, 2 decimals max)
value.IsInRange(min, max)                     // bool

// Date validation
date.IsNotFutureDate()                        // bool
birthDate.IsAgeInRange(minAge, maxAge)        // bool

// Collection validation
collection.IsNotNullOrEmpty()                 // bool

// File validation
fileName.HasAllowedExtension(".jpg", ".png")  // bool
fileSize.IsWithinSizeLimit(maxBytes)          // bool

// Pagination validation
ValidationExtensions.AreValidPaginationParams(page, pageSize)  // bool
```

## Pagination Extensions

```csharp
using CueFinder.Extensions.Pagination;

// Apply pagination
var paginated = query.Paginate(page, pageSize);           // IQueryable<T>
var paginated = collection.Paginate(page, pageSize);      // IEnumerable<T>

// Create paginated result
var result = items.ToPaginatedResult(page, pageSize, totalCount);

// Async with auto-count
var result = await query.ToPaginatedResultAsync(page, pageSize);

// Validate and normalize params
var (page, pageSize) = ValidationExtensions.ValidatePaginationParams(page, pageSize);

// Calculate total pages
var totalPages = PaginationExtensions.CalculateTotalPages(totalCount, pageSize);
```

## File Handling Extensions

```csharp
using CueFinder.Extensions.FileHandling;

// Validation
file.IsValidImage()                           // bool
file.IsValidDocument()                        // bool
files.AreValidImages()                        // bool
files.ValidateFiles(maxFiles, maxTotalSize)   // (bool isValid, List<string> errors)

// File operations
file.GenerateUniqueFileName()                 // string
fileName.SanitizeFileName()                   // string
await file.CalculateMD5HashAsync()            // string
await file.SaveToDirectoryAsync(path)         // string (saved filename)
await file.ToByteArrayAsync()                 // byte[]

// Utilities
fileSize.GetHumanReadableSize()               // string ("10.5 MB")
FileExtensions.GetMimeType(fileName)          // string
FileExtensions.DeleteIfExists(filePath)       // bool
```

## Logging Extensions

```csharp
using CueFinder.Extensions.Logging;

// Method logging
_logger.LogMethodEntry(methodName, parameters);
_logger.LogMethodExit(methodName, result);

// Execution time logging
var result = await _logger.LogExecutionTimeAsync(methodName, async () => { ... });
var result = _logger.LogExecutionTime(methodName, () => { ... });

// User actions
_logger.LogUserAction(userId, action, details);

// Security events
_logger.LogSecurityEvent(eventType, userId, details);

// Database operations
_logger.LogDatabaseOperation(operation, entity, parameters);

// External API calls
_logger.LogExternalApiCall(apiName, endpoint, method);

// Cache operations
_logger.LogCacheOperation(operation, key, success);

// Validation errors
_logger.LogValidationError(field, error, value);

// Business rules
_logger.LogBusinessRuleViolation(rule, details, userId);
```

## Caching Extensions

```csharp
using CueFinder.Extensions.Caching;

// Get from cache
var item = await _cache.GetAsync<T>(key);

// Set in cache
await _cache.SetAsync(key, value, TimeSpan.FromMinutes(10));

// Remove from cache
await _cache.RemoveAsync(key);

// Remove by pattern
await _cache.RemoveByPatternAsync("user:*");

// Check exists
var exists = await _cache.ExistsAsync(key);

// Get statistics
var stats = _cache.GetStatistics();
```

## Response Models

### ApiResponse<T>
```csharp
using CueFinder.Extensions.Responses;

var response = ApiResponse<Item>.SuccessResponse(item, "Success");
var response = ApiResponse<Item>.ErrorResponse("Error message", errors);

// Properties:
// - bool Success
// - string? Message
// - T? Data
// - Dictionary<string, string[]>? Errors
// - string? TraceId
// - DateTime Timestamp
```

### PaginatedApiResponse<T>
```csharp
var response = PaginatedApiResponse<Item>.Create(items, page, pageSize, totalCount);

// Additional Properties:
// - int Page
// - int PageSize
// - int TotalCount
// - int TotalPages
// - bool HasPreviousPage
// - bool HasNextPage
```

## Authentication Extensions

```csharp
using CueFinder.Extensions.Authentication;

// Setup in Program.cs
builder.Services.AddCueFinderJwtAuthentication(configuration);

// Generate token
var token = JwtExtensions.GenerateJwtToken(userId, email, userName, configuration);
var token = JwtExtensions.GenerateJwtToken(userId, email, userName, config, expirationMinutes: 120);

// Validate token
var principal = JwtExtensions.ValidateJwtToken(token, configuration);

// Extract user ID
var userId = JwtExtensions.ExtractUserIdFromToken(token);

// Check expiration
var isExpired = JwtExtensions.IsTokenExpired(token);
```

## Configuration

### appsettings.json
```json
{
  "JwtSettings": {
    "SecretKey": "your-secret-key-min-32-chars",
    "Issuer": "CueFinder",
    "Audience": "CueFinderAPI",
    "ExpirationMinutes": 60
  },
  "CacheSettings": {
    "DefaultExpirationMinutes": 10,
    "SlidingExpirationMinutes": 5,
    "MaxCacheSize": 1000,
    "EnableStatistics": true
  }
}
```

## Complete Example

```csharp
using CueFinder.Extensions.Controllers;
using CueFinder.Extensions.Validation;
using CueFinder.Extensions.Pagination;
using CueFinder.Extensions.Logging;

[HttpGet]
public async Task<IActionResult> GetItems(int page = 1, int pageSize = 10)
{
    _logger.LogMethodEntry(nameof(GetItems), new { page, pageSize });
    
    // Validate
    if (!ValidationExtensions.AreValidPaginationParams(page, pageSize))
        return this.BadRequestProblem("Invalid Parameters", "Invalid page or pageSize");
    
    // Get user
    var userId = User.GetUserIdOrThrow();
    _logger.LogUserAction(userId, "GetItems", new { page, pageSize });
    
    // Execute with timing
    var result = await _logger.LogExecutionTimeAsync(
        nameof(GetItems),
        async () => await _service.GetItemsAsync(page, pageSize));
    
    // Return paginated
    return this.OkPaginated(result.Items, page, pageSize, result.TotalCount);
}

[HttpPost]
public async Task<IActionResult> CreateItem([FromBody] CreateItemRequest request)
{
    // Validate model
    var validationError = this.ValidateModelState();
    if (validationError != null) return validationError;
    
    // Custom validation
    if (!request.Email.IsValidEmail())
        return this.BadRequestProblem("Validation Failed", "Invalid email format");
    
    if (!request.Price.IsValidPrice())
        return this.BadRequestProblem("Validation Failed", "Invalid price");
    
    // Sanitize and create
    var userId = User.GetUserIdOrThrow();
    var item = await _service.CreateAsync(
        request.Title.Sanitize(),
        request.Price,
        userId);
    
    return this.Created(nameof(GetItem), new { id = item.Id }, item, "Created successfully");
}

[HttpPost("upload")]
public async Task<IActionResult> UploadFiles([FromForm] IFormFileCollection files)
{
    var (isValid, errors) = files.ValidateFiles(maxFiles: 5);
    if (!isValid)
        return this.BadRequestProblem("Invalid Files", string.Join(", ", errors));
    
    var results = new List<string>();
    foreach (var file in files)
    {
        var fileName = await file.SaveToDirectoryAsync("wwwroot/uploads");
        results.Add(fileName);
    }
    
    return this.Ok(results, "Files uploaded successfully");
}
```

## Common Patterns

### Controller Pattern
1. Log method entry
2. Validate input (model state, custom validation)
3. Get user ID from claims
4. Execute business logic with timing
5. Return standardized response

### Service Pattern
1. Log method entry with parameters
2. Check cache
3. Validate business rules
4. Execute database operation
5. Update cache
6. Log completion

### Error Handling Pattern
```csharp
try
{
    // Operation
}
catch (KeyNotFoundException)
{
    return this.NotFoundProblem("Not Found", "Resource not found");
}
catch (UnauthorizedAccessException)
{
    return this.ForbiddenProblem();
}
catch (ArgumentException ex)
{
    return this.BadRequestProblem("Invalid Input", ex.Message);
}
catch (Exception ex)
{
    _logger.LogError(ex, "Unexpected error");
    return this.InternalServerErrorProblem();
}
```
