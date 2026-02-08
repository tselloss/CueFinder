using CueFinder.Auth.Extensions;
using CueFinder.Database.Context;
using CueFinderBookingBE.Data;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

// Configure Npgsql to handle DateTime without timezone issues
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.NumberHandling = System.Text.Json.Serialization.JsonNumberHandling.AllowReadingFromString;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var bookingConnectionString = builder.Configuration.GetConnectionString("BookingConnection")
    ?? throw new InvalidOperationException("Connection string 'BookingConnection' not found.");

var cueFinderConnectionString = builder.Configuration.GetConnectionString("CueFinderConnection")
    ?? bookingConnectionString;

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseNpgsql(bookingConnectionString));

builder.Services.AddDbContext<CueFinderDbContext>(options =>
    options.UseNpgsql(cueFinderConnectionString));

builder.Services.AddAuthServices(builder.Configuration);

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var corsOrigins = builder.Configuration.GetSection("CorsOrigins");
var allowedOrigins = new List<string>();

if (builder.Environment.IsDevelopment())
{
    allowedOrigins.Add("http://localhost:3001");
    allowedOrigins.Add("http://127.0.0.1:3001");
}

var frontendOrigin = corsOrigins["Frontend"];
if (!string.IsNullOrEmpty(frontendOrigin))
{
    var origins = frontendOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    foreach (var origin in origins)
    {
        if (!allowedOrigins.Contains(origin))
        {
            allowedOrigins.Add(origin);
        }
    }
}

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

using (var scope = app.Services.CreateScope())
{
    var bookingDb = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    bookingDb.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }))
    .AllowAnonymous();

if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowDevelopment");
}
else
{
    app.UseCors("AllowFrontend");
}

app.UseForwardedHeaders();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
