using CueFinder.Auth.Extensions;
using CueFinder.Database.Context;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using CueFinder.Extensions.Email;
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

// Register repository and service dependencies required by AddAuthServices
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddEmailService(builder.Configuration);

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

    // Ensure buddy tables exist for databases created before this feature was added
    await bookingDb.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""BuddyPosts"" (
            ""Id"" uuid NOT NULL,
            ""UserId"" uuid NOT NULL,
            ""UserName"" varchar(200) NOT NULL,
            ""LocationName"" varchar(300),
            ""PlayDate"" timestamp NOT NULL,
            ""StartTime"" varchar(10) NOT NULL,
            ""SkillLevel"" varchar(30) NOT NULL,
            ""Notes"" varchar(1000),
            ""Status"" varchar(20) NOT NULL DEFAULT 'open',
            ""CreatedAt"" timestamp NOT NULL,
            CONSTRAINT ""PK_BuddyPosts"" PRIMARY KEY (""Id"")
        );
        CREATE TABLE IF NOT EXISTS ""BuddyRequests"" (
            ""Id"" uuid NOT NULL,
            ""BuddyPostId"" uuid NOT NULL,
            ""RequesterId"" uuid NOT NULL,
            ""RequesterName"" varchar(200) NOT NULL,
            ""SkillLevel"" varchar(30) NOT NULL,
            ""Message"" varchar(500),
            ""Status"" varchar(20) NOT NULL DEFAULT 'pending',
            ""ReviewScore"" integer,
            ""ReviewNote"" varchar(500),
            ""CreatedAt"" timestamp NOT NULL,
            CONSTRAINT ""PK_BuddyRequests"" PRIMARY KEY (""Id""),
            CONSTRAINT ""FK_BuddyRequests_BuddyPosts"" FOREIGN KEY (""BuddyPostId"")
                REFERENCES ""BuddyPosts""(""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_BuddyPosts_UserId"" ON ""BuddyPosts""(""UserId"");
        CREATE INDEX IF NOT EXISTS ""IX_BuddyPosts_Status"" ON ""BuddyPosts""(""Status"");
        CREATE INDEX IF NOT EXISTS ""IX_BuddyRequests_BuddyPostId"" ON ""BuddyRequests""(""BuddyPostId"");
        CREATE INDEX IF NOT EXISTS ""IX_BuddyRequests_RequesterId"" ON ""BuddyRequests""(""RequesterId"");
    ");

    // Add HourlyRate column to BilliardClubTables if missing
    await bookingDb.Database.ExecuteSqlRawAsync(@"
        ALTER TABLE ""BilliardClubTables"" ADD COLUMN IF NOT EXISTS ""HourlyRate"" numeric(10,2);
        ALTER TABLE ""BilliardClubRecords"" ADD COLUMN IF NOT EXISTS ""DefaultHourlyRate"" numeric(10,2);
    ");

    // Create TableSessions table if missing
    await bookingDb.Database.ExecuteSqlRawAsync(@"
        CREATE TABLE IF NOT EXISTS ""TableSessions"" (
            ""Id"" uuid NOT NULL,
            ""TableId"" uuid NOT NULL,
            ""LocationId"" uuid NOT NULL,
            ""RecordId"" uuid NOT NULL,
            ""CustomerName"" varchar(200) NOT NULL DEFAULT '',
            ""HourlyRate"" numeric(10,2),
            ""StartedAt"" timestamp NOT NULL,
            ""EndedAt"" timestamp,
            ""TotalMinutes"" integer,
            ""TotalCost"" numeric(10,2),
            ""StartedByUserId"" uuid NOT NULL,
            ""CreatedAt"" timestamp NOT NULL,
            CONSTRAINT ""PK_TableSessions"" PRIMARY KEY (""Id""),
            CONSTRAINT ""FK_TableSessions_BilliardClubTables"" FOREIGN KEY (""TableId"")
                REFERENCES ""BilliardClubTables""(""Id"") ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS ""IX_TableSessions_TableId"" ON ""TableSessions""(""TableId"");
        CREATE INDEX IF NOT EXISTS ""IX_TableSessions_RecordId"" ON ""TableSessions""(""RecordId"");
        CREATE INDEX IF NOT EXISTS ""IX_TableSessions_StartedAt"" ON ""TableSessions""(""StartedAt"");
        CREATE INDEX IF NOT EXISTS ""IX_TableSessions_EndedAt"" ON ""TableSessions""(""EndedAt"");
    ");
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
