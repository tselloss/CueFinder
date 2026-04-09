# CueFinder Workspace Instructions

## Repository Shape

- `CueFinderBE` is the main ASP.NET Core backend.
- `SolutionLibraries` contains shared backend libraries.
- `CueFinderFE` is the frontend workspace and should be treated as the home for web and future mobile client work.

## Mobile Expansion Rule

When asked to add or plan iOS and Android support, prefer one shared mobile codebase inside the existing frontend workspace instead of building two separate feature stacks.

Default recommendation:

- keep one repository
- keep one backend API surface
- keep one shared frontend package layer
- build one mobile app workspace that outputs both iOS and Android apps

## Frontend Reuse Rules

- Reuse `CueFinderFE/packages/api`, `CueFinderFE/packages/auth`, and `CueFinderFE/packages/common` wherever possible.
- Treat shared packages as runtime-agnostic. Do not access `window`, `document`, `localStorage`, or browser-only globals directly from code that may be reused on mobile.
- If browser-only behavior is required, isolate it behind a web-specific adapter.
- Do not reuse DOM-oriented UI components in React Native. Share business logic and data contracts, not browser components.

## Package Boundary Rules

- Keep API clients, DTO mappers, validators, and auth session logic in shared packages.
- Keep web-only UI in a web-specific package or the web app itself.
- Keep mobile-only UI in a mobile-specific package or the mobile app itself.
- Prefer adding adapters for storage, deep links, uploads, and environment config instead of branching logic throughout the app.

## Mobile Stack Preference

Unless the user explicitly requests a different stack, prefer:

- React Native with Expo
- shared packages in the existing pnpm workspace
- secure token storage on mobile

## Backend Rules For Mobile Work

- Reuse existing REST endpoints before proposing mobile-only endpoints.
- Only change backend contracts when mobile requirements clearly need it.
- Keep auth, upload, and messaging flows compatible across web and mobile.

## Planning Rules

For mobile planning requests:

- identify what can be reused from the current solution
- call out platform blockers explicitly
- propose phased delivery with an MVP first
- avoid recommending two independent codebases for iOS and Android unless the user explicitly requires native-only separation

## Documentation Rule

When making material changes to the mobile architecture or shared package strategy, update the relevant documentation in `docs/`.