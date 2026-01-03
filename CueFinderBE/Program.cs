using CueFinder.Data.Extensions;
using CueFinder.Common.Extensions;
using CueFinder.Auth.Extensions;
using CueFinder.User.Extensions;
using CueFinder.Cues.Extensions;
using CueFinder.Rating.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register module services in order of dependencies
builder.Services.AddCommonServices();
builder.Services.AddDataServices(builder.Configuration);
builder.Services.AddAuthServices(builder.Configuration);
builder.Services.AddUserServices(builder.Configuration);
builder.Services.AddCueServices(builder.Configuration);
builder.Services.AddRatingServices(builder.Configuration);

// Add CORS
var corsOrigins = builder.Configuration.GetSection("CorsOrigins");
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(corsOrigins["Frontend"] ?? "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
