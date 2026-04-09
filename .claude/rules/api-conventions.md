# API Design Conventions

## RESTful Design Principles

### Resource Naming
- Use **nouns**, not verbs (e.g., `/users`, not `/getUsers`)
- Use **plural** for collections (e.g., `/listings`, `/cues`)
- Use **kebab-case** for multi-word resources (e.g., `/password-reset-tokens`)

### HTTP Methods
- `GET` - Retrieve resource(s) (safe, idempotent)
- `POST` - Create new resource
- `PUT` - Full update (replace entire resource)
- `PATCH` - Partial update
- `DELETE` - Remove resource

### Examples
```
GET    /api/users           → List users (with pagination)
GET    /api/users/{id}      → Get specific user
POST   /api/users           → Create new user
PUT    /api/users/{id}      → Update user (full replacement)
PATCH  /api/users/{id}      → Update user (partial)
DELETE /api/users/{id}      → Delete user
```

## Endpoint Structure

### Route Template
```
/api/[controller]/[action]
```

### Controller Organization
```csharp
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
}
```

## Request/Response Models

### Request DTOs
```csharp
public class ForgotPasswordRequest
{
    [Required]
    [EmailAddress]
    public string EmailOrUsername { get; set; } = string.Empty;
}
```

### Response DTOs
```csharp
public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
```

## HTTP Status Codes

### Success Codes
- **200 OK** - Request succeeded
- **201 Created** - Resource created (return Location header)
- **204 No Content** - Success with no response body (e.g., DELETE)

### Client Error Codes
- **400 Bad Request** - Validation error, malformed request
- **401 Unauthorized** - Authentication required or failed
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate resource (e.g., email exists)
- **422 Unprocessable Entity** - Validation error (semantic)
- **429 Too Many Requests** - Rate limit exceeded

### Server Error Codes
- **500 Internal Server Error** - Unhandled exception

## Response Format

### Success Response
```json
{
  "data": {
    "id": 123,
    "username": "john_doe"
  },
  "message": "User retrieved successfully"
}
```

### Error Response
```json
{
  "message": "Email is required",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

### List Response (with Pagination)
```json
{
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "pageSize": 20,
    "totalCount": 97
  }
}
```

## Validation

### Server-Side Validation
```csharp
if (string.IsNullOrWhiteSpace(request.Email))
{
    return BadRequest(new { message = "Email is required" });
}

if (!IsValidEmail(request.Email))
{
    return BadRequest(new { message = "Invalid email format" });
}
```

### Data Annotations
```csharp
public class RegisterRequest
{
    [Required(ErrorMessage = "Username is required")]
    [MinLength(3, ErrorMessage = "Username must be at least 3 characters")]
    [MaxLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = string.Empty;
}
```

## Pagination

### Query Parameters
```
GET /api/listings?page=2&pageSize=20&sortBy=createdAt&order=desc
```

### Implementation
```csharp
[HttpGet]
public async Task<IActionResult> GetListings(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
{
    var query = _dbContext.Listings.Where(l => l.IsActive);
    var total = await query.CountAsync();
    
    var items = await query
        .Skip((page - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();
    
    return Ok(new
    {
        data = items,
        pagination = new
        {
            currentPage = page,
            pageSize = pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
            totalCount = total
        }
    });
}
```

## Filtering & Sorting

### Query Parameters
```
GET /api/cues?brand=predator&minPrice=100&maxPrice=500&sortBy=price&order=asc
```

### Implementation
```csharp
var query = _dbContext.Cues.AsQueryable();

if (!string.IsNullOrEmpty(brand))
    query = query.Where(c => c.Brand == brand);

if (minPrice.HasValue)
    query = query.Where(c => c.Price >= minPrice);

if (sortBy == "price")
    query = order == "desc" ? query.OrderByDescending(c => c.Price) : query.OrderBy(c => c.Price);
```

## Security

### Authentication Required
```csharp
[Authorize]
[HttpGet("profile")]
public async Task<IActionResult> GetProfile()
```

### Role-Based Authorization
```csharp
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteUser(int id)
```

### Rate Limiting
- Implement rate limiting for sensitive endpoints (login, password reset)
- Return `429 Too Many Requests` when exceeded

## Versioning

### URL Versioning (Current Approach)
```
/api/v1/users
/api/v2/users
```

### Header Versioning (Alternative)
```
GET /api/users
X-API-Version: 2
```

## Error Handling

### Global Exception Handler
```csharp
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        
        var error = context.Features.Get<IExceptionHandlerFeature>();
        if (error != null)
        {
            _logger.LogError(error.Error, "Unhandled exception");
            await context.Response.WriteAsJsonAsync(new
            {
                message = "An error occurred processing your request"
            });
        }
    });
});
```

## CORS

### Configuration
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", builder =>
    {
        builder
            .WithOrigins("http://localhost:3000", "https://billiardscuefinder.com")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});
```

## Documentation

### XML Documentation
```csharp
/// <summary>
/// Request a password reset link
/// </summary>
/// <param name="request">Email or username</param>
/// <returns>Success message (uniform response)</returns>
/// <response code="200">Reset link sent if account exists</response>
/// <response code="429">Too many requests</response>
[HttpPost("forgot-password")]
[ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
[ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
```

### Swagger/OpenAPI
- Enabled in development environment
- Accessible at `/swagger`
- Auto-generated from XML comments
