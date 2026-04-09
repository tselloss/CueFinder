# Testing Guidelines

## Backend Testing

### Unit Tests
- Location: `tests/` folder (create if needed)
- Framework: xUnit or NUnit
- Naming: `MethodName_Scenario_ExpectedBehavior`

```csharp
[Fact]
public async Task GenerateResetToken_ValidUser_ReturnsToken()
{
    // Arrange
    var service = new PasswordResetService(_dbContext, _authService, _config, _logger);
    var userId = 1;

    // Act
    var token = await service.GenerateResetTokenAsync(userId, "127.0.0.1", "TestAgent");

    // Assert
    Assert.NotNull(token);
    Assert.NotEmpty(token);
}
```

### Integration Tests
- Test full API endpoints
- Use in-memory database or test database
- Clean up after each test

### Test Coverage
- Aim for 70%+ coverage on business logic
- 100% coverage on critical paths (auth, payments)
- Don't test framework code or simple getters/setters

## Frontend Testing

### Component Tests
- Framework: React Testing Library
- Test user interactions, not implementation details

```javascript
import { render, screen, fireEvent } from '@testing-library/react';

test('forgot password submits email', async () => {
  render(<ForgotPassword />);
  
  const input = screen.getByPlaceholderText(/email/i);
  fireEvent.change(input, { target: { value: 'test@example.com' } });
  
  const button = screen.getByText(/send link/i);
  fireEvent.click(button);
  
  // Assert success message appears
});
```

### E2E Tests
- Location: `tests/SecurityTests/`
- Use Playwright or Puppeteer
- Test critical flows: auth, checkout, listing creation

## Security Testing

### Password Reset Testing
1. Valid token flow
2. Expired token rejection
3. Used token rejection
4. Rate limiting enforcement
5. Account enumeration prevention

### Penetration Testing Checklist
- SQL injection attempts
- XSS attempts
- CSRF protection
- Rate limiting
- Authentication bypass attempts

## Manual Testing Checklist

### Before Deployment
- [ ] Test all modified endpoints via Postman/Insomnia
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test internationalization (English + Greek)
- [ ] Check browser console for errors
- [ ] Verify database migrations applied
- [ ] Test error scenarios (network failures, validation errors)

### Cross-Browser Testing
- Chrome (primary)
- Firefox
- Safari
- Edge

## Test Data

### Use Factories
```csharp
public static User CreateTestUser()
{
    return new User
    {
        Username = "testuser",
        Email = "test@example.com",
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password123"),
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    };
}
```

### Don't Use Production Data
- Never test against production database
- Use anonymized data for testing
- Create seed scripts for test data

## Performance Testing

### Load Testing
- Use k6 or Apache JMeter
- Test API endpoints under load
- Identify bottlenecks

### Monitoring
- Check response times (< 200ms for most endpoints)
- Monitor database query performance
- Check memory usage

## Debugging Tests

### Failed Test Checklist
1. Read error message carefully
2. Check test data setup
3. Verify dependencies (DB, external services)
4. Run test in isolation
5. Check for race conditions (async issues)

### Logging in Tests
```csharp
_logger.LogInformation("Test setup: Creating user with id {UserId}", userId);
```

## CI/CD Testing

### GitHub Actions
- Tests run on every PR
- Block merge if tests fail
- Run different test suites (unit, integration, E2E)

### Test Environments
- **Local**: Full control, fast iteration
- **Staging**: Mirror of production
- **CI**: Automated, clean state
