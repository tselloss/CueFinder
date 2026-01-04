# CueFinder Test Projects

This directory contains comprehensive unit and integration tests for the CueFinder backend libraries.

## Test Structure

### Unit Tests (`/tests/UnitTests`)

Unit tests focus on testing individual components in isolation using mocks and stubs.

#### CueFinder.Auth.Tests
- **TokenServiceTests.cs**: Tests JWT token generation and validation
  - Token generation with different roles
  - Token expiration validation
  - Claims verification
  
- **AuthServiceTests.cs**: Tests in-memory authentication service
  - Login with username/email
  - User registration
  - Profile management
  - Validation and error handling

- **DatabaseAuthServiceTests.cs**: Tests database-backed authentication
  - Login with database integration
  - Password hashing and verification
  - Account activation status
  - Profile updates with validation

#### CueFinder.Database.Tests
- **UserRepositoryTests.cs**: Tests user repository operations
  - CRUD operations
  - Username and email lookups
  - Case-insensitive searches
  - Role-based queries

- **CueRepositoryTests.cs**: Tests cue repository operations
  - Active cues retrieval
  - Search functionality
  - Pagination
  - Brand and location filtering

- **UserServiceTests.cs**: Tests user service layer
  - Service-level validation
  - Business logic
  - Error handling

- **CueServiceTests.cs**: Tests cue service layer
  - Cue lifecycle management
  - Mark as sold functionality
  - Active cue counting

### Integration Tests (`/tests/IntegrationTests`)

Integration tests verify that components work together correctly with real dependencies.

#### CueFinder.Auth.IntegrationTests
- **DatabaseAuthServiceIntegrationTests.cs**: End-to-end authentication flows
  - Complete registration → login → profile flow
  - Email-based login
  - Duplicate username/email handling
  - Last login timestamp tracking
  - Inactive user rejection

#### CueFinder.Database.IntegrationTests
- **DatabaseIntegrationTests.cs**: End-to-end database operations
  - Complete user lifecycle (create → update → delete)
  - Complete cue lifecycle (create → update → mark sold → delete)
  - User-cue relationships
  - Search functionality
  - Pagination verification
  - Active vs sold cue filtering

## Running Tests

### Run All Tests
```powershell
cd C:\Users\karac\source\repos\CueFinder
dotnet test
```

### Run Specific Test Project
```powershell
# Unit tests
dotnet test tests/UnitTests/CueFinder.Auth.Tests/CueFinder.Auth.Tests.csproj
dotnet test tests/UnitTests/CueFinder.Database.Tests/CueFinder.Database.Tests.csproj

# Integration tests
dotnet test tests/IntegrationTests/CueFinder.Auth.IntegrationTests/CueFinder.Auth.IntegrationTests.csproj
dotnet test tests/IntegrationTests/CueFinder.Database.IntegrationTests/CueFinder.Database.IntegrationTests.csproj
```

### Run Tests with Coverage
```powershell
dotnet test --collect:"XPlat Code Coverage"
```

### Run Specific Test
```powershell
dotnet test --filter "FullyQualifiedName~TokenServiceTests.GenerateToken_WithValidInputs_ReturnsValidJwtToken"
```

## Test Technologies

- **xUnit**: Test framework
- **Moq**: Mocking library for unit tests
- **FluentAssertions**: Fluent assertion library for readable tests
- **EntityFramework InMemory**: In-memory database for integration tests
- **Microsoft.NET.Test.Sdk**: Test SDK for .NET

## Test Patterns

### Unit Tests
- Use `Moq` to create mock dependencies
- Test single responsibility per test method
- Follow Arrange-Act-Assert (AAA) pattern
- Use descriptive test names: `MethodName_Scenario_ExpectedResult`

### Integration Tests
- Use in-memory database for isolation
- Implement `IDisposable` to clean up database after each test
- Test complete workflows and scenarios
- Verify database state changes

## Coverage Areas

### Authentication (CueFinder.Auth)
✅ Token generation and validation
✅ User registration with validation
✅ Login with username/email
✅ Password hashing and verification
✅ Profile management
✅ Duplicate detection
✅ Account status handling

### Database (CueFinder.Database)
✅ User CRUD operations
✅ Cue CRUD operations
✅ Repository patterns
✅ Service layer logic
✅ Search and filtering
✅ Pagination
✅ Relationships (User ↔ Cue)
✅ Active/sold status filtering

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on other tests
2. **Clarity**: Test names clearly describe what is being tested
3. **Speed**: Unit tests run fast; integration tests use in-memory database
4. **Reliability**: Tests are deterministic and repeatable
5. **Maintainability**: Tests follow the same structure as implementation code

## Continuous Integration

These tests are designed to run in CI/CD pipelines. They:
- Don't require external dependencies
- Use in-memory databases
- Clean up after themselves
- Provide clear failure messages

## Adding New Tests

When adding new features to CueFinder.Auth or CueFinder.Database:

1. Add corresponding unit tests for new methods/classes
2. Add integration tests for complete workflows
3. Follow the existing test structure and naming conventions
4. Ensure tests are isolated and don't depend on test execution order
5. Use meaningful test data that represents real-world scenarios

## Test Coverage Goals

- **Unit Tests**: Aim for 80%+ code coverage
- **Integration Tests**: Cover all critical user workflows
- **Edge Cases**: Test boundary conditions and error scenarios
- **Performance**: Verify pagination and large dataset handling

## Troubleshooting

### Tests fail with database errors
- Ensure each test uses a unique in-memory database (use `Guid.NewGuid().ToString()`)
- Implement `IDisposable` and call `_context.Database.EnsureDeleted()`

### Mocks not working as expected
- Verify mock setup matches exact method signature
- Use `It.IsAny<T>()` for flexible matching
- Check that method is virtual or from an interface

### Tests timeout
- Avoid `Task.Delay` in tests unless necessary
- Use `ConfigureAwait(false)` for async operations
- Ensure proper disposal of resources

## Related Documentation

- [CueFinder.Auth Documentation](../../SolutionLibraries/CueFinder.Auth/DATABASE_AUTH_GUIDE.md)
- [CueFinder.Database Documentation](../../SolutionLibraries/CueFinder.Database/README.md)
- [Main Documentation Index](../../DOCUMENTATION_INDEX.md)
