# Migration Strategy for CueFinderFE Monorepo

## Current State
- `CueFinderFE/cuefinderfe/` contains the old single-app structure
- New monorepo structure created in `CueFinderFE/packages/`

## Migration Options

### Option A: Hard Migration (Full Code Move) - RECOMMENDED
Move all source files from `cuefinderfe/src` → `packages/app/src`

**Pros:**
- Clean monorepo structure
- All packages are self-contained
- Easier to manage dependencies
- Better for team workflows

**Cons:**
- Requires moving all files
- May break existing references temporarily

### Option B: Symlink Strategy
Keep code in `cuefinderfe/src` but link it to `packages/app/src`

**Pros:**
- Minimal file changes
- Can gradually migrate

**Cons:**
- More fragile
- Not ideal for monorepos
- Cross-platform issues on Windows

## Recommended Next Steps

1. **Keep existing `cuefinderfe/` for now** - It still works
2. **Create `packages/app/src`** - Point to actual source
3. **Gradually refactor imports** - Use workspace aliases (`@cuefinder/...`)
4. **Update Dockerfile** - Already done ✓

## Simple Workaround for Now

The Dockerfile can use symlinks or copy strategy. Here's what we'll do:

Create a build-helper script that:
1. Copies/links old source to new location
2. Runs pnpm install
3. Builds as monorepo

This lets you work on migration gradually without breaking anything.
