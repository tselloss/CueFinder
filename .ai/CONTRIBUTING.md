# Contributing Guide

Guidelines for contributing to the CueFinder project.

## Development Workflow

### 1. Branch Strategy

We use **Git Flow** branching model:

```
main (production)
  └── release (staging)
       └── feature/* (development)
```

**Branch Types**:
- `main` - Production-ready code
- `release` - Staging and pre-production testing
- `feature/*` - New features and bug fixes
- `hotfix/*` - Emergency production fixes

### 2. Creating a Feature Branch

```powershell
# Start from release branch
git checkout release
git pull origin release

# Create feature branch
git checkout -b feature/raffle-auto-end

# Make your changes...

# Commit with conventional commits format
git add .
git commit -m "feat: add auto-end raffle when full"

# Push to remote
git push origin feature/raffle-auto-end
```

### 3. Pull Request Process

1. **Create PR** from your feature branch to `release`
2. **Fill PR template** with:
   - Description of changes
   - Related issues
   - Testing performed
   - Screenshots (if UI changes)
3. **Request review** from team lead
4. **Address feedback** and push updates
5. **Merge** after approval (squash and merge preferred)

## Code Standards

### C# Coding Conventions

Follow [Microsoft C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/fundamentals/coding-style/).

**Key Points**:
- PascalCase for classes, methods, properties
- camelCase for private fields
- Use `var` when type is obvious
- XML documentation for public APIs
- No regions in code
- File-scoped namespaces (C# 10+)

**Example**:
```csharp
namespace CueFinder.Raffles.Services;

/// <summary>
/// Service for managing raffle operations
/// </summary>
public class RaffleService : IRaffleService
{
    private readonly CueFinderDbContext _context;
    private readonly ILogger<RaffleService> _logger;

    public RaffleService(CueFinderDbContext context, ILogger<RaffleService> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Creates a new raffle listing
    /// </summary>
    public async Task<RaffleDto> CreateRaffleAsync(CreateRaffleDto dto, int userId)
    {
        // Implementation...
    }
}
```

### JavaScript/React Conventions

**Style**:
- Use Prettier for formatting
- ESLint for linting
- camelCase for variables and functions
- PascalCase for React components
- Functional components with hooks

**Example**:
```javascript
import React, { useState, useEffect } from 'react';
import { raffleService } from '../services/raffleService';

export const RaffleList = () => {
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const data = await raffleService.getAllRaffles();
      setRaffles(data);
    } catch (error) {
      console.error('Failed to load raffles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="raffle-list">
      {raffles.map(raffle => (
        <RaffleCard key={raffle.id} raffle={raffle} />
      ))}
    </div>
  );
};
```

## Testing Requirements

### Unit Tests Required

All new features must include unit tests:

**Coverage Requirements**:
- Services: 90%+
- Controllers: 80%+
- Business logic: 95%+

**Test Naming**:
```csharp
MethodName_Scenario_ExpectedBehavior
```

**Examples**:
```csharp
[Fact]
public async Task CreateRaffleAsync_ValidData_CreatesRaffle() { }

[Fact]
public async Task CreateRaffleAsync_InvalidUserId_ThrowsException() { }
```

### Integration Tests

Complex workflows should have integration tests:

```csharp
[Fact]
public async Task FullRaffleWorkflow_CreateToWinner_Success()
{
    // Test entire user journey from creation to winner selection
}
```

### Running Tests Before PR

```powershell
# Run all tests
dotnet test

# Ensure all pass
# Passed!  - Failed:     0, Passed:    50, Skipped:     0
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

**Format**:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting)
- `refactor` - Code refactoring
- `test` - Adding/updating tests
- `chore` - Maintenance tasks

**Examples**:
```
feat(raffles): add auto-end when full option

fix(auth): resolve JWT token expiration issue

docs(api): add raffle endpoints documentation

test(raffles): add unit tests for auto-close logic
```

## Code Review Checklist

### For Authors

Before requesting review:
- [ ] Code follows project conventions
- [ ] All tests pass locally
- [ ] New features have unit tests
- [ ] No console.log or debug code
- [ ] No commented-out code
- [ ] PR description is clear
- [ ] Related documentation updated

### For Reviewers

When reviewing:
- [ ] Code is readable and maintainable
- [ ] Business logic is correct
- [ ] Tests are comprehensive
- [ ] No security vulnerabilities
- [ ] Performance considerations addressed
- [ ] Error handling is appropriate
- [ ] Database migrations are safe

## Database Changes

### Creating Migrations

```powershell
# Create migration
cd CueFinderBE
dotnet ef migrations add AddAutoEndToRaffles --project ../SolutionLibraries/CueFinder.Database

# Review generated migration
# Edit if needed

# Test migration locally
dotnet ef database update --project ../SolutionLibraries/CueFinder.Database
```

### Migration Guidelines

1. **Descriptive Names**: Use clear migration names
2. **Backward Compatible**: Avoid breaking changes when possible
3. **Test Rollback**: Ensure `Down()` method works
4. **Data Migration**: Include data migration logic if needed
5. **Review SQL**: Always review generated SQL

**Example Migration**:
```csharp
public partial class AddAutoEndToRaffles : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "AutoEndWhenFull",
            table: "Raffles",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "AutoEndWhenFull",
            table: "Raffles");
    }
}
```

## Documentation

### Code Documentation

**C# XML Comments**:
```csharp
/// <summary>
/// Creates a new raffle with the specified parameters
/// </summary>
/// <param name="dto">Raffle creation data</param>
/// <param name="userId">ID of the user creating the raffle</param>
/// <returns>The created raffle information</returns>
/// <exception cref="ArgumentException">Thrown when dto validation fails</exception>
public async Task<RaffleDto> CreateRaffleAsync(CreateRaffleDto dto, int userId)
```

**JSDoc Comments**:
```javascript
/**
 * Fetches all raffles with optional status filter
 * @param {string} status - Optional status filter (open, closed, drawn)
 * @returns {Promise<Array>} Array of raffle objects
 */
export const getAllRaffles = async (status = null) => { }
```

### Feature Documentation

When adding new features, update:
1. **[FEATURES.md](.ai/FEATURES.md)** - Feature description
2. **[API.md](.ai/API.md)** - API endpoints
3. **[DATABASE.md](.ai/DATABASE.md)** - Schema changes
4. **README** - If user-facing changes

## Development Tips

### Debugging

**Backend**:
- Use breakpoints in Visual Studio/VS Code
- Check logs in console output
- Use SQL Profiler for database queries

**Frontend**:
- React DevTools browser extension
- Console.log strategically
- Network tab for API calls

### Common Pitfalls

1. **Async/Await**: Always await async methods, never `.Result`
2. **Dispose DbContext**: Use `using` statements or ensure disposal
3. **SQL Injection**: Always use parameterized queries (EF handles this)
4. **XSS**: React escapes by default, but be careful with `dangerouslySetInnerHTML`
5. **CORS**: Ensure API allows frontend origin

### Performance

- Use `.AsNoTracking()` for read-only queries
- Avoid N+1 queries with `.Include()`
- Index frequently queried columns
- Use pagination for large datasets
- Cache static data

## Getting Help

1. **Check Documentation**: Review files in `.ai/` folder
2. **Search Issues**: Look for similar issues on GitHub
3. **Ask Team**: Reach out in team chat
4. **Create Issue**: If it's a bug or feature request

## Issue Reporting

When reporting bugs, include:

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: Windows 11
- Browser: Chrome 120
- .NET Version: 8.0

## Screenshots
[If applicable]

## Additional Context
[Any other relevant information]
```

## License

By contributing, you agree that your contributions will be licensed under the project's license.

---

Last Updated: April 2, 2026
