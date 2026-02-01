using CueFinder.Database.Extensions;
using CueFinder.Extensions.ProblemDetails;
using CueFinder.Extensions.Moderation;

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

// Add moderation services
builder.Services.AddModerationServices();

// Add ProblemDetails support
builder.Services.AddCueFinderProblemDetails(
    includeExceptionDetails: builder.Environment.IsDevelopment());

// Add CORS for main backend communication
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowBackend", policy =>
    {
        var backendUrl = builder.Configuration["BackendUrl"] ?? "http://localhost:5000";
        policy
            .WithOrigins(backendUrl)
            .AllowAnyMethod()
            .AllowAnyHeader();
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

// Health check endpoint
app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();

app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseHttpsRedirection();
app.UseAuthorization();
app.UseCors("AllowBackend");

app.MapControllers();

app.Run();
