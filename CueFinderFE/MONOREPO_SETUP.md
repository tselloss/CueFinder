# CueFinder Frontend Monorepo

pnpm workspace-based monorepo for the CueFinder frontend application.

## Structure

```
packages/
├── app/           - Main React application
├── common/        - Shared utilities, hooks, constants
├── ui/            - Reusable UI components
├── api/           - API clients and services
└── auth/          - Authentication utilities
```

## Getting Started

### Option 1: Automated Setup (Recommended)

**Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**Windows (PowerShell):**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\setup.ps1
```

### Option 2: Manual Setup

1. **Install pnpm** (if not already installed)
```bash
npm install -g pnpm
```

2. **Run build helper** (syncs old source to new structure)
```bash
node scripts/build-helper.js
```

3. **Install dependencies**
```bash
pnpm install
```

## Development

### Start Development Server
```bash
pnpm start
```

### Build for Production
```bash
pnpm build
```

### Run Tests
```bash
pnpm test
```

### Run E2E Tests
```bash
pnpm test:e2e
pnpm test:e2e:ui      # With UI
pnpm test:e2e:headed  # Headed mode
pnpm test:e2e:debug   # Debug mode
```

## Docker

### Build Docker Image
```bash
docker build -t cuefinder-frontend:latest .
```

### Run with Docker Compose
```bash
docker compose up frontend
```

The Dockerfile automatically:
- Uses the build-helper to sync old source
- Installs pnpm and dependencies
- Builds the @cuefinder/app package
- Serves with nginx

## Architecture Benefits

1. **Code Separation**: Each package has clear responsibility
2. **Reusability**: Import components/utilities with `@cuefinder/package-name`
3. **Performance**: pnpm deduplicates dependencies, faster installs
4. **Scalability**: Easy to add new packages or extract to separate repos
5. **Testing**: Test each package in isolation
6. **Type Safety**: Clear package boundaries enforce contracts

## Migration Path

### Current Status: Phase 2
- ✅ Monorepo structure created
- ✅ Package definitions set up
- ✅ Build helper created
- ✅ Docker updated
- ⏳ Source code migration (gradual)

### Phase 3: Optimize Code Organization
Your old `cuefinderfe/src` is still used. To fully optimize:

1. **Move components to `packages/ui/src`**
   ```
   packages/ui/src/components/
   ├── Badge.js
   ├── Button.js
   ├── Modal.js
   └── ...
   ```

2. **Move API clients to `packages/api/src`**
   ```
   packages/api/src/
   ├── client.js      # axios instance
   ├── hooks.js       # useApi, useFetch
   └── services.js    # API endpoints
   ```

3. **Move auth utilities to `packages/auth/src`**
   ```
   packages/auth/src/
   ├── hooks.js       # useAuth
   ├── context.js     # AuthProvider
   └── utils.js       # token handling
   ```

4. **Move shared utilities to `packages/common/src`**
   ```
   packages/common/src/
   ├── hooks.js       # useLocalStorage, useDebounce
   ├── utils.js       # formatters, validators
   └── constants.js   # API_URL, etc
   ```

5. **Update imports** in `packages/app/src`
   ```javascript
   // Old
   import { Badge } from '../components/Badge';
   import { useApi } from '../api/hooks';
   
   // New
   import { Badge } from '@cuefinder/ui';
   import { useApi } from '@cuefinder/api';
   ```

### Phase 4: Full Migration
Once all code is organized in packages, you can:
- Remove the `cuefinderfe` directory
- Use pure monorepo structure
- Extract packages as npm modules if needed

## Commands Reference

### Workspace Commands
```bash
# Run in specific package
pnpm --filter @cuefinder/app start

# Run in all packages
pnpm -r lint

# Run in packages matching pattern
pnpm --filter @cuefinder/* test
```

### Dependency Management
```bash
# Add to specific package
pnpm --filter @cuefinder/ui add react-icons

# Add dev dependency
pnpm --filter @cuefinder/app add -D @types/react

# Remove package dependency
pnpm --filter @cuefinder/common remove lodash
```

## File Structure Reference

```
CueFinderFE/
├── packages/
│   ├── app/
│   │   ├── package.json
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── index.js
│   │   │   ├── App.js
│   │   │   └── components/
│   │   └── nginx-frontend.conf
│   ├── common/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── hooks.js
│   │       ├── utils.js
│   │       └── constants.js
│   ├── ui/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       └── components/
│   ├── api/
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.js
│   │       ├── client.js
│   │       ├── hooks.js
│   │       └── services.js
│   └── auth/
│       ├── package.json
│       └── src/
│           ├── index.js
│           ├── hooks.js
│           ├── context.js
│           └── utils.js
├── cuefinderfe/
│   ├── src/           (old structure - being migrated)
│   ├── public/
│   └── package.json   (kept for backward compatibility)
├── scripts/
│   └── build-helper.js
├── pnpm-workspace.yaml
├── .npmrc
├── package.json       (root)
├── setup.sh
├── setup.ps1
├── Dockerfile
└── MONOREPO_SETUP.md
```

## Troubleshooting

### `pnpm: command not found`
```bash
npm install -g pnpm
```

### `ENOENT: no such file or directory` during build
Run the setup script:
```bash
pnpm --filter @cuefinder/app install
node scripts/build-helper.js
```

### Module not found errors
Ensure you're importing from the correct package:
```javascript
import { Badge } from '@cuefinder/ui';  // ✅ Correct
import { Badge } from '../components'; // ❌ Wrong
```

### Docker build fails
Make sure all files are copied:
```bash
docker build --progress=plain -t cuefinder-frontend:latest .
```

## Next Steps

1. **Start the development server**
   ```bash
   pnpm start
   ```

2. **Create issues for code organization**
   - Move UI components to `@cuefinder/ui`
   - Move API logic to `@cuefinder/api`
   - etc.

3. **Update tests** to use new package structure

4. **Update CI/CD** workflows for monorepo

5. **Document API** for each package
