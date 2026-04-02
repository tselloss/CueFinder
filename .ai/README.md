# CueFinder Development Guide

Welcome to the CueFinder development documentation. This folder contains comprehensive guides for developing, testing, and maintaining the CueFinder application.

## 📁 Documentation Structure

- **[SETUP.md](SETUP.md)** - Development environment setup
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - System architecture and design patterns
- **[DATABASE.md](DATABASE.md)** - Database schema and migrations
- **[API.md](API.md)** - API endpoints and contracts
- **[TESTING.md](TESTING.md)** - Testing strategy and guidelines
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment procedures
- **[FEATURES.md](FEATURES.md)** - Feature documentation
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## 🚀 Quick Start

1. **Setup Environment**: Follow [SETUP.md](SETUP.md)
2. **Understand Architecture**: Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Run Tests**: See [TESTING.md](TESTING.md)
4. **Start Development**: Check [CONTRIBUTING.md](CONTRIBUTING.md)

## 🏗️ Technology Stack

### Backend
- **Framework**: ASP.NET Core 8.0
- **Database**: PostgreSQL 15
- **ORM**: Entity Framework Core 8.0
- **Authentication**: JWT Bearer Tokens
- **Testing**: xUnit, Moq, FluentAssertions

### Frontend
- **Framework**: React 18
- **Routing**: React Router v6
- **Internationalization**: i18next
- **Styling**: Tailwind CSS
- **Build**: Vite

### Infrastructure
- **Container**: Docker & Docker Compose
- **Web Server**: Nginx (for frontend)
- **CI/CD**: GitHub Actions

## 📦 Project Structure

```
CueFinder/
├── CueFinderBE/               # Main backend API
├── CueFinderFE/               # Frontend application
├── SolutionLibraries/         # Shared libraries
│   ├── CueFinder.Accessories/ # Accessories feature
│   ├── CueFinder.Auth/        # Authentication
│   ├── CueFinder.BilliardTables/ # Billiard tables
│   ├── CueFinder.Core/        # Core utilities
│   ├── CueFinder.CueCases/    # Cue cases
│   ├── CueFinder.Cues/        # Cues marketplace
│   ├── CueFinder.CueSets/     # Cue sets
│   ├── CueFinder.Database/    # Database context & models
│   ├── CueFinder.Extensions/  # Common extensions
│   ├── CueFinder.Forum/       # Community forum
│   ├── CueFinder.Messages/    # Messaging system
│   └── CueFinder.Raffles/     # Raffle system
├── tests/                     # Test projects
│   ├── UnitTests/
│   └── IntegrationTests/
└── .ai/                       # Development documentation
```

## 🎯 Core Features

1. **Marketplace**
   - Cues, Cue Cases, Billiard Tables, Accessories, Cue Sets
   - Image upload and management
   - Advanced filtering and search
   - Location-based listings

2. **Raffle System**
   - Create and manage raffles
   - Spot-based entry system
   - Payment verification
   - Winner selection and notifications
   - Auto-close when full

3. **Community Forum**
   - Discussions and posts
   - Categories and topics
   - User interactions
   - Moderation system

4. **Messaging**
   - Direct messages between users
   - System notifications
   - Message threads

5. **User Management**
   - Authentication (Email/Password, Google OAuth)
   - User profiles with verification
   - Seller ratings and reviews
   - Location and contact info

## 🧪 Testing Strategy

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test feature workflows end-to-end
- **Coverage Goal**: 80%+ for critical business logic
- See [TESTING.md](TESTING.md) for detailed guidelines

## 🔒 Security

- JWT-based authentication
- Password hashing with BCrypt
- SQL injection protection via EF Core
- CORS configuration
- Input validation and sanitization
- Role-based authorization (User, Admin, Moderator)

## 📊 Development Workflow

1. Create feature branch from `release`
2. Implement feature with tests
3. Run all tests locally
4. Create pull request
5. Code review
6. Merge to `release`
7. Deploy to production

## 🐛 Common Issues

See each specific guide for troubleshooting:
- Database issues: [DATABASE.md](DATABASE.md)
- Test failures: [TESTING.md](TESTING.md)
- Build problems: [SETUP.md](SETUP.md)

## 📝 Code Style

- **C#**: Follow Microsoft C# Coding Conventions
- **JavaScript/React**: ESLint + Prettier
- **Naming**: PascalCase for C#, camelCase for JS
- **Comments**: XML docs for public APIs
- **Commits**: Conventional Commits format

## 🤝 Getting Help

- Check relevant documentation in `.ai/` folder
- Review existing tests for examples
- Check GitHub issues
- Contact team leads

---

Last Updated: April 2, 2026
