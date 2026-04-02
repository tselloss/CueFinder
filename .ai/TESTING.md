# Testing Guide

Comprehensive testing strategy and guidelines for CueFinder application.

## Testing Philosophy

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test feature workflows end-to-end
- **Coverage Goal**: 80%+ for business logic
- **Test-Driven**: Write tests before/during feature development

## Testing Stack

| Tool | Purpose | Version |
|------|---------|---------|
| **xUnit** | Testing framework | 2.9.2 |
| **Moq** | Mocking library | 4.20.72 |
| **FluentAssertions** | Assertion library | 6.12.2 |
| **Microsoft.EntityFrameworkCore.InMemory** | In-memory DB for unit tests | 8.0 |
| **Npgsql** | PostgreSQL for integration tests | 8.0 |

## Project Structure

```
tests/
├── UnitTests/
│   ├── CueFinder.Raffles.Tests/
│   ├── CueFinder.Cues.Tests/
│   ├── CueFinder.CueCases.Tests/
│   ├── CueFinder.Auth.Tests/
│   ├── CueFinder.Database.Tests/
│   ├── CueFinder.Extensions.Tests/
│   ├── CueFinder.Forum.Tests/
│   ├── CueFinder.Accessories.Tests/        # TO BE CREATED
│   ├── CueFinder.BilliardTables.Tests/     # TO BE CREATED
│   ├── CueFinder.CueSets.Tests/            # TO BE CREATED
│   └── CueFinder.Messages.Tests/           # TO BE CREATED
│
└── IntegrationTests/
    ├── CueFinder.Raffles.IntegrationTests/
    ├── CueFinder.Cues.IntegrationTests/
    ├── CueFinder.Auth.IntegrationTests/
    └── DatabaseTestBase.cs                 # Shared test infrastructure
```

## Unit Testing

### Unit Test Template

```csharp
using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CueFinder.Database.Context;
using CueFinder.Database.Models;

namespace CueFinder.Raffles.Tests.Services
{
    public class RaffleServiceTests : IDisposable
    {
        private readonly CueFinderDbContext _context;
        private readonly Mock<ILogger<RaffleService>> _loggerMock;
        private readonly Mock<IMessageService> _messageServiceMock;
        private readonly RaffleService _service;

        public RaffleServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new CueFinderDbContext(options);
            
            // Setup mocks
            _loggerMock = new Mock<ILogger<RaffleService>>();
            _messageServiceMock = new Mock<IMessageService>();

            // Create service under test
            _service = new RaffleService(
                _context,
                _loggerMock.Object,
                _messageServiceMock.Object
            );

            // Seed test data
            SeedTestData();
        }

        private void SeedTestData()
        {
            var user = new User
            {
                Id = 1,
                Username = "testuser",
                Email = "test@example.com",
                Name = "Test User"
            };

            _context.Users.Add(user);
            _context.SaveChanges();
        }

        [Fact]
        public async Task CreateRaffleAsync_ValidData_CreatesRaffle()
        {
            // Arrange
            var dto = new CreateRaffleDto
            {
                Title = "Test Raffle",
                TotalSpots = 100,
                PricePerSpot = 10m,
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = false
            };

            // Act
            var result = await _service.CreateRaffleAsync(dto, userId: 1);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Test Raffle");
            result.TotalSpots.Should().Be(100);

            var savedRaffle = await _context.Raffles.FindAsync(result.Id);
            savedRaffle.Should().NotBeNull();
            savedRaffle!.Status.Should().Be("open");
        }

        [Fact]
        public async Task UpdateRaffleAsync_WithActiveBookings_ThrowsException()
        {
            // Arrange
            var raffle = new Raffle
            {
                Id = 1,
                OrganizerId = 1,
                Title = "Test",
                TotalSpots = 10,
                PricePerSpot = 5m,
                Status = "open",
                EndsAt = DateTime.UtcNow.AddDays(1)
            };

            var entry = new RaffleEntry
            {
                RaffleId = 1,
                UserId = 1,
                SpotNumber = 1,
                PaymentStatus = "paid"
            };

            _context.Raffles.Add(raffle);
            _context.RaffleEntries.Add(entry);
            await _context.SaveChangesAsync();

            var updateDto = new UpdateRaffleDto { Title = "Updated" };

            // Act
            Func<Task> act = async () => await _service.UpdateRaffleAsync(1, updateDto, userId: 1);

            // Assert
            await act.Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("*active bookings*");
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}
```

### Unit Test Best Practices

1. **Test One Thing**: Each test should verify a single behavior
2. **AAA Pattern**: Arrange, Act, Assert
3. **Descriptive Names**: `MethodName_Scenario_ExpectedBehavior`
4. **Independent Tests**: No test should depend on another
5. **Fast Execution**: Use in-memory database
6. **Mock External Dependencies**: Database, HTTP calls, file system
7. **FluentAssertions**: Use for readable assertions

### Example Test Categories

**Create Operations**
```csharp
[Fact] public async Task CreateRaffleAsync_ValidData_CreatesRaffle()
[Fact] public async Task CreateRaffleAsync_InvalidUserId_ThrowsException()
[Fact] public async Task CreateRaffleAsync_NegativePrice_ThrowsException()
```

**Update Operations**
```csharp
[Fact] public async Task UpdateRaffleAsync_ValidData_UpdatesRaffle()
[Fact] public async Task UpdateRaffleAsync_WithActiveBookings_ThrowsException()
[Fact] public async Task UpdateRaffleAsync_NotOwner_ThrowsUnauthorizedException()
```

**Delete Operations**
```csharp
[Fact] public async Task DeleteRaffleAsync_NoBookings_DeletesRaffle()
[Fact] public async Task DeleteRaffleAsync_WithBookings_ThrowsException()
```

**Business Logic**
```csharp
[Fact] public async Task EnterRaffleAsync_AutoEndEnabled_ClosesWhenFull()
[Fact] public async Task VerifyEntryAsync_AllSpotsPaid_AutoClosesRaffle()
[Fact] public async Task DrawWinnerAsync_NoEntries_ThrowsException()
```

## Integration Testing

### Integration Test Template

```csharp
using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Xunit;
using FluentAssertions;

namespace CueFinder.Raffles.IntegrationTests
{
    public class RaffleServiceIntegrationTests : DatabaseTestBase
    {
        [Fact]
        public async Task FullRaffleWorkflow_CreateToWinner_Success()
        {
            // Arrange - Create organizer
            var organizer = new User
            {
                Username = "organizer",
                Email = "organizer@test.com",
                Name = "Organizer",
                PasswordHash = "hash"
            };
            DbContext.Users.Add(organizer);
            await DbContext.SaveChangesAsync();

            // Arrange - Create raffle
            var raffle = new Raffle
            {
                OrganizerId = organizer.Id,
                Title = "Integration Test Raffle",
                TotalSpots = 3,
                PricePerSpot = 10m,
                Status = "open",
                EndsAt = DateTime.UtcNow.AddDays(7),
                AutoEndWhenFull = true
            };
            DbContext.Raffles.Add(raffle);
            await DbContext.SaveChangesAsync();

            // Act - Enter raffle (3 participants)
            for (int i = 1; i <= 3; i++)
            {
                var participant = new User
                {
                    Username = $"user{i}",
                    Email = $"user{i}@test.com",
                    Name = $"User {i}",
                    PasswordHash = "hash"
                };
                DbContext.Users.Add(participant);
                await DbContext.SaveChangesAsync();

                var entry = new RaffleEntry
                {
                    RaffleId = raffle.Id,
                    UserId = participant.Id,
                    SpotNumber = i,
                    PaymentStatus = "paid",
                    ClaimedAt = DateTime.UtcNow
                };
                DbContext.RaffleEntries.Add(entry);
            }
            await DbContext.SaveChangesAsync();

            // Assert - Raffle auto-closed
            var updatedRaffle = await DbContext.Raffles
                .Include(r => r.Entries)
                .FirstAsync(r => r.Id == raffle.Id);

            updatedRaffle.Status.Should().Be("closed");
            updatedRaffle.Entries.Should().HaveCount(3);
            updatedRaffle.Entries.All(e => e.PaymentStatus == "paid").Should().BeTrue();
        }

        [Fact]
        public async Task UpdateRaffle_ConcurrentUpdate_LastWriteWins()
        {
            // Test concurrency handling
            var raffle = await CreateTestRaffleAsync();

            // Simulate concurrent updates
            var raffle1 = await DbContext.Raffles.FindAsync(raffle.Id);
            var raffle2 = await DbContext.Raffles.FindAsync(raffle.Id);

            raffle1!.Title = "Update 1";
            raffle2!.Title = "Update 2";

            await DbContext.SaveChangesAsync();

            // Second update should win
            DbContext.Entry(raffle2).State = EntityState.Modified;
            await DbContext.SaveChangesAsync();

            var final = await DbContext.Raffles.FindAsync(raffle.Id);
            final!.Title.Should().Be("Update 2");
        }
    }
}
```

### DatabaseTestBase

```csharp
using Microsoft.EntityFramework>Core;
using CueFinder.Database.Context;
using Xunit;

namespace CueFinder.IntegrationTests
{
    public abstract class DatabaseTestBase : IAsyncLifetime
    {
        protected CueFinderDbContext DbContext { get; private set; } = null!;

        public async Task InitializeAsync()
        {
            var options = new DbContextOptionsBuilder<CueFinderDbContext>()
                .UseNpgsql("Host=localhost;Port=5433;Database=cuefinder_test;Username=postgres;Password=test")
                .Options;

            DbContext = new CueFinderDbContext(options);
            await DbContext.Database.EnsureCreatedAsync();
        }

        public async Task DisposeAsync()
        {
            await DbContext.Database.EnsureDeletedAsync();
            await DbContext.DisposeAsync();
        }

        protected async Task<User> CreateTestUserAsync(string username = "testuser")
        {
            var user = new User
            {
                Username = username,
                Email = $"{username}@test.com",
                Name = username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("password")
            };

            DbContext.Users.Add(user);
            await DbContext.SaveChangesAsync();
            return user;
        }

        protected async Task<Raffle> CreateTestRaffleAsync(int? userId = null)
        {
            var organizer = userId.HasValue
                ? await DbContext.Users.FindAsync(userId.Value)
                : await CreateTestUserAsync();

            var raffle = new Raffle
            {
                OrganizerId = organizer!.Id,
                Title = "Test Raffle",
                TotalSpots = 10,
                PricePerSpot = 5m,
                Status = "open",
                EndsAt = DateTime.UtcNow.AddDays(7)
            };

            DbContext.Raffles.Add(raffle);
            await DbContext.SaveChangesAsync();
            return raffle;
        }
    }
}
```

### Integration Test Best Practices

1. **Real Database**: Use PostgreSQL (not in-memory)
2. **Isolation**: Each test gets fresh database
3. **Cleanup**: Implement IAsyncLifetime for setup/teardown
4. **Complete Workflows**: Test full user journeys
5. **Transaction Handling**: Verify commit/rollback
6. **Concurrency**: Test race conditions

## Running Tests

### Command Line

```powershell
# Run all tests
dotnet test

# Run unit tests only
dotnet test tests/UnitTests/

# Run specific test project
dotnet test tests/UnitTests/CueFinder.Raffles.Tests/

# Run specific test
dotnet test --filter "FullyQualifiedName~CreateRaffleAsync_ValidData"

# Run with verbose output
dotnet test --logger "console;verbosity=detailed"

# Generate coverage report
dotnet test --collect:"XPlat Code Coverage"
```

### Visual Studio

1. **Test Explorer**: View → Test Explorer
2. **Run All**: Click "Run All" button
3. **Debug Test**: Right-click test → Debug
4. **Live Unit Testing**: Enable for continuous testing

### VS Code

1. Install ".NET Core Test Explorer" extension
2. Tests appear in Testing sidebar
3. Click play button to run
4. Click debug button to debug test

## Code Coverage

### Generating Coverage

```powershell
# Install coverage tool
dotnet tool install --global dotnet-coverage

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Generate HTML report
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:coverage-report -reporttypes:Html
```

### Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| Services (Business Logic) | 90%+ |
| Controllers | 80%+ |
| Models/DTOs | N/A (no logic) |
| Database Context | 70%+ |
| Overall | 80%+ |

## Test Data Builders

```csharp
public class RaffleBuilder
{
    private int _organizerId = 1;
    private string _title = "Test Raffle";
    private int _totalSpots = 10;
    private decimal _pricePerSpot = 5m;
    private bool _autoEnd = false;

    public RaffleBuilder WithOrganizer(int id)
    {
        _organizerId = id;
        return this;
    }

    public RaffleBuilder WithAutoEnd(bool enabled)
    {
        _autoEnd = enabled;
        return this;
    }

    public Raffle Build()
    {
        return new Raffle
        {
            OrganizerId = _organizerId,
            Title = _title,
            TotalSpots = _totalSpots,
            PricePerSpot = _pricePerSpot,
            AutoEndWhenFull = _autoEnd,
            Status = "open",
            EndsAt = DateTime.UtcNow.AddDays(7)
        };
    }
}

// Usage
var raffle = new RaffleBuilder()
    .WithOrganizer(42)
    .WithAutoEnd(true)
    .Build();
```

## Testing Checklist

### Before Creating Feature

- [ ] Design test cases
- [ ] Create test project if needed
- [ ] Setup test data builders

### During Development

- [ ] Write failing unit tests
- [ ] Implement feature
- [ ] Make tests pass
- [ ] Add integration tests

### Before PR

- [ ] All tests passing
- [ ] Code coverage meets goals
- [ ] No skipped tests without reason
- [ ] Test names are descriptive

## Common Testing Patterns

### Testing Exceptions

```csharp
[Fact]
public async Task Method_InvalidInput_ThrowsException()
{
    // Arrange
    var invalidData = new CreateDto { /* invalid */ };

    // Act
    Func<Task> act = async () => await _service.MethodAsync(invalidData);

    // Assert
    await act.Should().ThrowAsync<ArgumentException>()
        .WithMessage("*validation*");
}
```

### Testing Async Operations

```csharp
[Fact]
public async Task Method_Async_ReturnsExpectedResult()
{
    // Always use async/await, never .Result or .Wait()
    var result = await _service.MethodAsync();
    result.Should().NotBeNull();
}
```

### Testing Collections

```csharp
[Fact]
public async Task GetAll_ReturnsFilteredResults()
{
    var results = await _service.GetAllAsync();
    
    results.Should().HaveCount(5);
    results.Should().AllSatisfy(r => r.IsActive.Should().BeTrue());
    results.Should().BeInDescendingOrder(r => r.CreatedAt);
}
```

### Mocking Services

```csharp
_messageServiceMock
    .Setup(m => m.SendNotificationAsync(It.IsAny<int>(), It.IsAny<string>()))
    .ReturnsAsync(true)
    .Verifiable();

// Later verify it was called
_messageServiceMock.Verify(
    m => m.SendNotificationAsync(1, "Raffle auto-closed"),
    Times.Once
);
```

## Troubleshooting

### Test Database Connection Failed

```powershell
# Start test database
docker run --name cuefinder-test-db -e POSTGRES_PASSWORD=test -e POSTGRES_DB=cuefinder_test -p 5433:5432 -d postgres:15
```

### In-Memory Database Not Working

Ensure unique database names:
```csharp
var options = new DbContextOptionsBuilder<CueFinderDbContext>()
    .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString()) // Unique!
    .Options;
```

### Tests Pass Locally But Fail in CI

- Check environment variables
- Ensure database is available
- Verify test isolation (no shared state)
- Check for timezone issues (use UTC)

---

Last Updated: April 2, 2026
