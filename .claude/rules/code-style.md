# Code Style Guide

## C# / .NET Backend

### Naming Conventions
- **PascalCase**: Classes, methods, properties, public fields
- **camelCase**: Parameters, local variables
- **_camelCase**: Private fields (with underscore prefix)
- **UPPER_CASE**: Constants

### Example
```csharp
public class UserService : IUserService
{
    private readonly ILogger<UserService> _logger;
    private readonly CueFinderDbContext _dbContext;
    private const int MAX_LOGIN_ATTEMPTS = 5;

    public async Task<User?> GetUserByIdAsync(int userId)
    {
        var user = await _dbContext.Users
            .Include(u => u.Profile)
            .FirstOrDefaultAsync(u => u.Id == userId);
        
        return user;
    }
}
```

### File Organization
- One class per file (except nested classes)
- File name matches class name
- Organize: usings → namespace → class → fields → constructors → methods
- Group by access modifier (public → protected → private)

### Async/Await
- Always use `async`/`await` for I/O operations
- Suffix async methods with `Async` (e.g., `GetUserAsync`)
- Never use `.Result` or `.Wait()` (causes deadlocks)

### Error Handling
```csharp
try
{
    // Business logic
}
catch (SpecificException ex)
{
    _logger.LogError(ex, "Specific error message");
    throw; // Re-throw or return error response
}
```

## React / JavaScript Frontend

### Naming Conventions
- **PascalCase**: Components, pages
- **camelCase**: Functions, variables, hooks
- **UPPER_SNAKE_CASE**: Constants, environment variables

### Component Structure
```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, []);

  const handleAction = async () => {
    // Event handlers
  };

  return (
    <div className="container">
      {/* JSX */}
    </div>
  );
}
```

### Hooks
- Use functional components (no class components)
- Custom hooks prefix with `use` (e.g., `useAuth`)
- Extract reusable logic into custom hooks

### Styling
- Use Tailwind CSS utility classes
- Use shadcn/ui components for UI primitives
- Avoid inline styles (except dynamic values)

### API Calls
```javascript
try {
  const response = await axios.post(`${API_BASE_URL}/endpoint`, data);
  // Handle success
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation error
  } else {
    // Handle generic error
  }
}
```

## SQL / Database

### Table Naming
- PascalCase, plural (e.g., `Users`, `PasswordResetTokens`)

### Column Naming
- PascalCase (e.g., `UserId`, `CreatedAt`)

### Indexes
- Prefix with `IX_` (e.g., `IX_Users_Email`)
- Name pattern: `IX_TableName_ColumnName(s)`

### Foreign Keys
- Prefix with `FK_` (e.g., `FK_Listings_Users_UserId`)

## General Best Practices

### Comments
- Use XML documentation for public APIs (C#)
- Use JSDoc for exported functions (JS)
- Avoid obvious comments (e.g., `// increment counter`)
- Explain *why*, not *what*

### Magic Numbers
```csharp
// ❌ Bad
if (password.Length < 8) { }

// ✅ Good
private const int MIN_PASSWORD_LENGTH = 8;
if (password.Length < MIN_PASSWORD_LENGTH) { }
```

### Boolean Variables
- Prefix with `is`, `has`, `can`, `should`
- Examples: `isActive`, `hasVerifiedEmail`, `canDelete`

### Method Length
- Keep methods under 30-40 lines
- Extract helper methods for complex logic
- One responsibility per method
