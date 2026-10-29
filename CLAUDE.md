# CueFinder
<!-- token-kit. Loaded on every Claude turn: keep it under ~80 lines, facts only. -->
Deployed billiard cue marketplace with real users (listings, forum, messages, raffles, moderation). Default branch: `release`.

## Stack
- Backend: ASP.NET Core .NET 8, EF Core (SQL Server), JWT auth, Swagger
- Frontend: React, pnpm workspace in `CueFinderFE/` (`packages/*`, `cuefinderfe`), Tailwind + Radix, i18next; Playwright e2e
- Deploy: Docker + nginx on Hetzner (`deployment/`, `scripts/`)

## Commands
- Backend build: `dotnet build CueFinderBE/CueFinderBE.sln -v q`
- Backend test one: `dotnet test tests/UnitTests --filter "FullyQualifiedName~<Name>" -v q`
- Frontend: `cd CueFinderFE && pnpm start` / `pnpm build` / `pnpm test`
- E2E: `cd CueFinderFE && pnpm test:e2e`

## Layout
- `CueFinderBE/` API host (controllers, Program.cs)
- `SolutionLibraries/CueFinder.<Feature>/` one library per domain: Cues, CueCases, CueSets, Accessories, BilliardTables, Forum, Messages, Raffles, Auth, Core, Extensions; `CueFinderModerator`
- `SolutionLibraries/CueFinder.Database/` DbContext, entities, migrations
- `CueFinderFE/packages/{app,api,auth,common,ui}/`; `CueFinderFE/cuefinderfe/` legacy CRA app
- `tests/{UnitTests,IntegrationTests,SecurityTests}/`

## Conventions
- New domain feature = new `SolutionLibraries/CueFinder.<Feature>` project referencing `CueFinder.Database` + `CueFinder.Extensions`
- Schema changes go through EF migrations in `CueFinder.Database`; prod schema updates use the `schema-safe-update` workflow

## Don't read unless asked
- `docs/` (110+ historical notes): grep by topic instead of browsing
- Root `*.txt` test logs, `*.sql`/`*.ps1` one-off scripts, `CueFinderFE/screenshots/`, `test-results/`

## Working rules
- One task per session; /clear between tasks (`/handoff` first). Plans in docs/plan.md.
- Global token rules: ~/.claude/CLAUDE.md
