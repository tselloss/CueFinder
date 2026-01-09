using CueFinder.Auth.Extensions;
using CueFinder.CueCases.Extensions;
using CueFinder.Cues.Extensions;
using CueFinder.Database.Extensions;
using CueFinder.Extensions.Caching;
using CueFinder.Extensions.ProblemDetails;

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

// Add ProblemDetails support with exception details in Development
builder.Services.AddCueFinderProblemDetails(
    includeExceptionDetails: builder.Environment.IsDevelopment());

// Add CORS
var corsOrigins = builder.Configuration.GetSection("CorsOrigins");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                corsOrigins["Frontend"] ?? "http://localhost:3000",
                "http://localhost:3000",
                "http://127.0.0.1:3000"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowedToAllowWildcardSubdomains();
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
