# CueFinder

A comprehensive marketplace platform for buying and selling pool cues.

## 📚 Documentation

All project documentation has been organized in the **[docs](./docs)** folder.

**Quick Links:**
- 📖 [Documentation Index](./docs/INDEX.md) - Complete documentation overview
- 🚀 [Start Here](./docs/START_HERE.md) - Getting started guide
- ✅ [Test Status](./docs/TEST_FIXES_COMPLETE.md) - Latest test results (100% passing)
- 🏗️ [Architecture](./docs/ARCHITECTURE_DIAGRAM.md) - System architecture
- 🎨 [Frontend Guide](./docs/FRONTEND_START_HERE.md) - Frontend documentation
- 🔐 [Auth Setup](./docs/AUTHENTICATION_SETUP.md) - Authentication guide
- 🗄️ [Database Setup](./docs/POSTGRESQL_SETUP_GUIDE.md) - Database configuration

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/tselloss/CueFinder.git

# Backend setup
cd CueFinderBE
dotnet restore
dotnet run

# Frontend setup
cd ../CueFinderFE/cuefinderfe
npm install
npm start
```

## 📊 Project Status

- ✅ **Backend**: .NET 8 with authentication & database
- ✅ **Frontend**: React + TypeScript with responsive design
- ✅ **Tests**: 94/94 unit tests passing (100%)
- ✅ **Database**: PostgreSQL with Docker support
- ✅ **Documentation**: Fully organized in `/docs`

## 🛠️ Technology Stack

**Backend:**
- .NET 8.0
- PostgreSQL
- Entity Framework Core
- JWT Authentication

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Axios

**Testing:**
- xUnit
- Moq
- FluentAssertions

## 📁 Project Structure

```
CueFinder/
├── docs/                    # 📚 All documentation
├── CueFinderBE/            # 🖥️ Backend (.NET 8)
├── CueFinderFE/            # 🎨 Frontend (React + TypeScript)
├── Models/                  # 📦 Shared models
├── SolutionLibraries/      # 📚 Shared libraries
│   ├── CueFinder.Auth/     # 🔐 Authentication
│   └── CueFinder.Database/ # 🗄️ Database access
└── tests/                   # ✅ Test projects
```

## 📄 License

This project is licensed under the MIT License.

## 👥 Contributing

Please refer to the [documentation](./docs) for contribution guidelines.

---

For detailed information, visit the **[Documentation Index](./docs/INDEX.md)**