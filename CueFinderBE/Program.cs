using CueFinder.Auth.Extensions;
using CueFinder.CueCases.Extensions;
using CueFinder.Cues.Extensions;
using CueFinder.Database.Extensions;
using CueFinder.Extensions.Caching;
using CueFinder.Extensions.Images;
using CueFinder.Extensions.ProblemDetails;

// Configure Npgsql to handle DateTime without timezone issues
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Get connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Register database services
builder.Services.AddDatabaseServices(connectionString);

// Register module services
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddCueServices();
builder.Services.AddCueCasesServices();

// Add caching services
builder.Services.AddCueFinderCaching(builder.Configuration);

// Add image upload/storage services
builder.Services.AddCueFinderImageServices(builder.Configuration);

// Add ProblemDetails support with exception details in Development
builder.Services.AddCueFinderProblemDetails(
    includeExceptionDetails: builder.Environment.IsDevelopment());

// Add CORS
var corsOrigins = builder.Configuration.GetSection("CorsOrigins");
var allowedOrigins = new List<string>();

// Only add localhost in Development environment
if (builder.Environment.IsDevelopment())
{
    allowedOrigins.Add("http://localhost:3000");
    allowedOrigins.Add("http://127.0.0.1:3000");
    Console.WriteLine("🔧 CORS: Development mode - localhost origins added");
}

// Add configured frontend origin(s) - supports comma-separated values
var frontendOrigin = corsOrigins["Frontend"];
if (!string.IsNullOrEmpty(frontendOrigin))
{
    // Split by comma to support multiple origins
    var origins = frontendOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    foreach (var origin in origins)
    {
        if (!allowedOrigins.Contains(origin))
        {
            allowedOrigins.Add(origin);
        }
    }
    Console.WriteLine($"✅ CORS: Added production origin(s): {frontendOrigin}");
}
else
{
    Console.WriteLine("⚠️ CORS: No production frontend origin configured");
}

Console.WriteLine($"🔧 CORS: Allowed origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins.ToArray())
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Initialize database
await app.Services.InitializeDatabaseAsync();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Simple health endpoint for container orchestration / load balancers.
// Keep it lightweight (no DB dependency) so it reflects process liveness.
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();

// CORS must be before UseHttpsRedirection
app.UseCors("AllowFrontend");

// Enable static files for serving uploaded images
app.UseStaticFiles();

// Add exception handler and status code pages for ProblemDetails
app.UseExceptionHandler();
app.UseStatusCodePages();

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
