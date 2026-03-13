using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CueFinderBookingBE.Data;

public class BookingDbContextFactory : IDesignTimeDbContextFactory<BookingDbContext>
{
    public BookingDbContext CreateDbContext(string[] args)
    {
        // Load configuration from appsettings so the connection string is available at design time
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .Build();

        var connectionString = configuration.GetConnectionString("BookingConnection")
            ?? "Host=localhost;Port=5432;Database=cuefinder_booking;Username=postgres;Password=admin;SslMode=Disable;";

        var optionsBuilder = new DbContextOptionsBuilder<BookingDbContext>();
        optionsBuilder.UseNpgsql(connectionString);

        return new BookingDbContext(optionsBuilder.Options);
    }
}
