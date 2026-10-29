# cuefinder
<!-- token-kit. Loaded on every Claude turn: keep it under ~80 lines, facts only. -->

## Stack
- .NET (8.0.x)
- Node (pnpm) in `.`

## Commands
- Build: `dotnet build CueFinderBE/CueFinderBE.sln -v q`
- Test one: `dotnet test CueFinderBE/CueFinderBE.sln --filter "FullyQualifiedName~<Name>" -v q`

## Layout
- `CueFinderBE/` — TODO
- `CueFinderFE/` — TODO
- `SolutionLibraries/` — TODO
- `deployment/` — TODO
- `docs/` — TODO
- `init.sql/` — TODO
- `migrations/` — TODO
- `scripts/` — TODO
- `test-results/` — TODO
- `tests/` — TODO

## Conventions
- TODO (naming, error handling, where new endpoints/components go)

## Working rules
- One task per session; /clear between tasks. Keep plans in docs/plan.md.
- Global token rules: ~/.claude/CLAUDE.md
