using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using CueFinder.Database.Context;
using CueFinder.Database.Repositories;
using CueFinder.Database.Services;
using Npgsql.EntityFrameworkCore.PostgreSQL;

namespace CueFinder.Database.Extensions
{
    /// <summary>
    /// Extension methods for registering database services
    /// </summary>
    public static class DatabaseServiceExtension
    {
        /// <summary>
        /// Add database services to dependency injection container
        /// </summary>
        public static IServiceCollection AddDatabaseServices(
            this IServiceCollection services,
            string connectionString)
        {
            // Register DbContext
            services.AddDbContext<CueFinderDbContext>(options =>
                options.UseNpgsql(connectionString,
                    npgsqlOptions => npgsqlOptions.CommandTimeout(30))
            );

            // Register generic repository
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

            // Register specialized repositories
            services.AddScoped<ICueRepository, CueRepository>();
            services.AddScoped<IUserRepository, UserRepository>();

            // Register services
            services.AddScoped<ICueService, CueService>();
            services.AddScoped<IUserService, UserService>();

            return services;
        }

        /// <summary>
        /// Initialize database (create or migrate)
        /// </summary>
        public static async Task InitializeDatabaseAsync(this IServiceProvider serviceProvider)
        {
            using (var scope = serviceProvider.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<CueFinderDbContext>();
                
                try
                {
                    // Apply pending migrations
                    await dbContext.Database.MigrateAsync();
                    
                    // Seed initial data if needed
                    await SeedDataAsync(dbContext);
                }
                catch (Exception ex)
                {
                    throw new InvalidOperationException(
                        "An error occurred while initializing the database.", ex);
                }
            }
        }

        /// <summary>
        /// Seed initial data to database
        /// </summary>
        private static async Task SeedDataAsync(CueFinderDbContext context)
        {
            // Only seed if data doesn't exist
            if (context.Users.Any())
                return;

            // Add seed data here if needed
            await context.SaveChangesAsync();
        }
    }
}
