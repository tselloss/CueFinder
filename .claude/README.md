# Claude AI Agent Instructions - CueFinder Project

This folder contains **modular agent instructions** that help AI assistants understand and work with the CueFinder codebase effectively.

## 📁 Structure

```
.claude/
├── settings.json              # Model preferences & command permissions
├── settings.local.json        # User-specific local settings
├── rules/                     # Modular coding guidelines
│   ├── code-style.md         # C# and React coding conventions
│   ├── testing.md            # Testing strategies and patterns
│   └── api-conventions.md    # RESTful API design patterns
└── commands/                  # Feature-specific guides
    └── password-reset.md     # Password reset implementation guide
```

## 🎯 Purpose

This structure follows the **Claude Code Project organization pattern** for:

1. **Consistency** - Standardized coding patterns across the project
2. **Onboarding** - Quick reference for new developers and AI assistants
3. **Quality** - Enforced best practices and conventions
4. **Modularity** - Separate concerns into focused documents

## 📖 How to Use

### For AI Assistants

When working on CueFinder:

1. **Start with CLAUDE.md** (root) - Understand the project overview
2. **Check relevant rules/** - Follow coding conventions
3. **Review commands/** - For feature-specific guidance
4. **Apply settings.json** - Respect permissions and model preferences

### For Developers

Reference these files when:
- Writing new features
- Reviewing code
- Setting up development environment
- Understanding project architecture

## 📚 File Descriptions

### settings.json
Contains:
- **Model selection** - Preferred AI model (Claude Sonnet 4)
- **Command permissions** - Allowed terminal commands
- **Tool access** - Permitted operations

### rules/code-style.md
Defines:
- Naming conventions (C#, JavaScript, SQL)
- File organization
- Async/await patterns
- Error handling
- Component structure
- Styling guidelines

### rules/testing.md
Covers:
- Unit testing patterns
- Integration testing
- E2E testing
- Security testing
- Manual testing checklists
- Performance testing

### rules/api-conventions.md
Specifies:
- RESTful endpoint design
- Request/Response DTOs
- HTTP status codes
- Pagination patterns
- Error handling
- Authentication
- CORS configuration

### commands/password-reset.md
Details:
- Token security patterns
- Account enumeration prevention
- Email templates
- Common mistakes to avoid
- Configuration requirements

## 🚀 Quick Examples

### Creating New Features

When adding a new feature, AI assistants should:

1. **Follow code-style.md** - Use correct naming, structure
2. **Apply api-conventions.md** - Design RESTful endpoints
3. **Implement testing.md** - Write comprehensive tests
4. **Update commands/** - Add feature-specific guide if complex

### Code Review

Check that code follows:
- ✅ Naming conventions from code-style.md
- ✅ API patterns from api-conventions.md
- ✅ Testing coverage from testing.md
- ✅ Security practices (especially for auth features)

## 🔧 Extending This Structure

To add new guidelines:

1. **General patterns** → Add to `rules/`
2. **Feature-specific** → Add to `commands/`
3. **Keep modular** → One concern per file
4. **Use examples** → Show code snippets

Example new file:
```
.claude/rules/deployment.md      # Deployment procedures
.claude/commands/raffle-system.md  # Raffle feature guide
```

## 🎨 Benefits

### For AI Assistants
- Clear context about project structure
- Established patterns to follow
- Security best practices
- Feature-specific guidance

### For Developers
- Consistent codebase
- Quick onboarding
- Reference documentation
- Reduced code review friction

### For the Project
- Maintainability
- Scalability
- Quality assurance
- Knowledge preservation

## 🔗 Related Files

- **CLAUDE.md** (root) - Main project overview
- **docs/** - Comprehensive feature documentation
- **tests/** - Test scripts and examples
- **.ai/** - Additional AI-generated documentation

## 📝 Maintenance

Update these files when:
- Coding patterns change
- New features are added
- Best practices evolve
- Security requirements update

Keep files:
- **Concise** - Focus on essentials
- **Current** - Reflect actual codebase
- **Modular** - One concern per file
- **Practical** - Include code examples

---

**Created**: April 8, 2026  
**Pattern**: Claude Code Project Structure  
**Purpose**: AI assistant guidance and developer reference
