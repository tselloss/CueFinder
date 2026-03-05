using CueFinder.Auth.Extensions;
using CueFinder.Auth.Middleware;
using CueFinder.CueCases.Extensions;
using CueFinder.Accessories.Extensions;
using CueFinder.BilliardTables.Extensions;
using CueFinder.Raffles.Extensions;
using CueFinder.Cues.Extensions;
using CueFinder.Database.Extensions;
using CueFinder.Auth.Controllers;
using CueFinder.BilliardTables.Controllers;
using CueFinder.Cues.Controllers;
using CueFinder.CueCases.Controllers;
using CueFinder.Accessories.Controllers;
using CueFinder.Extensions.Caching;
using CueFinder.Extensions.Controllers;
using CueFinder.Extensions.Email;
using CueFinder.Extensions.Images;
using CueFinder.Extensions.Moderation;
using CueFinder.Extensions.ProblemDetails;
using CueFinder.Forum.Extensions;
using CueFinder.Messages.Extensions;
using CueFinder.Messages.Hubs;
using CueFinderBE.Services;
using Microsoft.AspNetCore.HttpOverrides;

// Configure Npgsql to handle DateTime without timezone issues
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

// Add services to the container and load controllers from shared libraries
builder.Services
    .AddControllers()
    .AddApplicationPart(typeof(ModerationController).Assembly)
    .AddApplicationPart(typeof(CueFinder.Raffles.Controllers.RafflesController).Assembly)
    .AddApplicationPart(typeof(SellersController).Assembly)
    .AddApplicationPart(typeof(BilliardTablesController).Assembly)
    .AddApplicationPart(typeof(CuesController).Assembly)
    .AddApplicationPart(typeof(CueCasesController).Assembly)
    .AddApplicationPart(typeof(AccessoriesController).Assembly)
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSignalR();

// Get connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

// Register database services
builder.Services.AddDatabaseServices(connectionString);

// Register module services
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddCueServices();
builder.Services.AddCueCasesServices();
builder.Services.AddBilliardTablesServices();
builder.Services.AddAccessoriesServices();
builder.Services.AddRaffleServices();
builder.Services.AddMessageServices();
builder.Services.AddForumServices(connectionString);

// Add email service
builder.Services.AddEmailService(builder.Configuration);

// Add caching services
builder.Services.AddCueFinderCaching(builder.Configuration);

// Configure forwarded headers for nginx proxy (HTTPS)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Add image upload/storage services
builder.Services.AddCueFinderImageServices(builder.Configuration);

// Add moderation services (local - can be replaced with HTTP client if needed)
builder.Services.AddModerationServices();

// Add HTTP Moderation Client for calling CueFinderModerator microservice
var moderationServiceUrl = builder.Configuration["ModerationServiceUrl"] ?? "http://localhost:5001";
builder.Services.AddHttpClient<IHttpModerationClient, HttpModerationClient>(client =>
{
    client.BaseAddress = new Uri(moderationServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(30);
})
.ConfigureHttpClient(client =>
{
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

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
        policy
            .WithOrigins(allowedOrigins.ToArray())
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .WithExposedHeaders("Content-Disposition", "X-Total-Count");
    });
    
    // Development-only permissive CORS for debugging
    if (builder.Environment.IsDevelopment())
    {
        options.AddPolicy("AllowDevelopment", policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
    }
});

var app = builder.Build();

// Initialize database
await app.Services.InitializeDatabaseAsync();

// Initialize Forum database with auto-migrations unless explicitly skipped
var skipForumInit = Environment.GetEnvironmentVariable("SKIP_FORUM_INIT");
if (!string.Equals(skipForumInit, "true", StringComparison.OrdinalIgnoreCase))
{
    try
    {
        await app.Services.InitializeForumDatabaseAsync();
    }
    catch (Exception ex)
    {
        // Log but don't crash - forum may already be initialized
        Console.WriteLine($"⚠️ Forum initialization note: {ex.Message}");
    }
}
else
{
    Console.WriteLine("⏭️ Skipping forum initialization due to SKIP_FORUM_INIT=true");
}

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
if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowDevelopment");
}
else
{
    app.UseCors("AllowFrontend");
}

// Enable static files for serving uploaded images
var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Add exception handler and status code pages for ProblemDetails
app.UseExceptionHandler();
app.UseStatusCodePages();

// Add rate limiting middleware (before authentication)
app.UseRateLimiting(requestLimit: 5, timeWindowSeconds: 60);

// Use forwarded headers from nginx proxy (for HTTPS)
if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<MessageHub>("/hubs/messages");

app.Run();
