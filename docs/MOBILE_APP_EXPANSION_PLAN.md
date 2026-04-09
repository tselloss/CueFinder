# CueFinder Mobile App Expansion Plan

## Goal

Add mobile apps for iOS and Android without creating a second copy of CueFinder business logic.

The recommended approach is to extend the current frontend workspace and build one shared mobile codebase that produces two deliverables:

- CueFinder iOS app
- CueFinder Android app

This keeps the backend, authentication rules, API contracts, and marketplace logic aligned with the current solution.

## Current Reuse Opportunity

The existing repository already has the right starting point for this approach:

- ASP.NET Core backend APIs already serve the web application.
- The frontend already uses a pnpm monorepo in `CueFinderFE`.
- Shared frontend packages already exist for `api`, `auth`, `common`, and `ui`.

That means the mobile work should focus on extracting reusable logic cleanly instead of rebuilding features from scratch.

## Recommended Architecture

Keep the current repository and expand `CueFinderFE` into a multi-app workspace.

Recommended target structure:

```text
CueFinderFE/
├── apps/
│   ├── web/                 # current web app target
│   └── mobile/              # new Expo/React Native app for iOS + Android
├── packages/
│   ├── api/                 # shared API clients
│   ├── auth/                # shared auth logic
│   ├── common/              # shared hooks, validators, helpers
│   ├── domain/              # new shared models and business rules
│   ├── storage/             # new storage abstraction
│   ├── ui-web/              # web-only UI components
│   └── ui-mobile/           # mobile-only UI components
└── package.json
```

## Technology Decision

Recommended mobile stack:

- React Native with Expo
- React Navigation
- Expo SecureStore for token storage
- Shared JavaScript or TypeScript packages in the existing monorepo

Why this fits the current solution:

- The team already uses React patterns.
- Existing shared packages can be reused with controlled refactoring.
- One mobile codebase can ship both iOS and Android.
- The backend does not need a parallel mobile-specific API unless a feature explicitly requires it.

## Important Constraints Found In The Current Frontend

Before mobile code can reuse the current packages, these issues need to be corrected:

1. `@cuefinder/api` still reads tokens directly from `localStorage` in several services.
2. `@cuefinder/ui` is web-oriented and depends on browser and DOM packages such as `react-dom` and Radix UI.
3. Some logic is still likely living in the web app layer instead of the shared package layer.
4. The web app is still on `react-scripts`, so package boundaries need to stay explicit during the migration.

These are not blockers. They define the first refactoring phase.

## Delivery Plan

### Phase 0: Baseline And Decisions

Duration: 2 to 4 days

Deliverables:

- Confirm Expo + React Native as the mobile stack.
- Decide whether to keep JavaScript or migrate shared packages to TypeScript during the mobile work.
- Inventory web-only dependencies inside shared packages.
- Freeze the first mobile MVP scope.

Exit criteria:

- Mobile stack decision documented.
- Shared package reuse map approved.
- MVP backlog agreed.

### Phase 1: Shared Package Hardening

Duration: 4 to 8 days

Deliverables:

- Introduce a storage abstraction package instead of direct `localStorage` usage.
- Move business rules and DTO shaping into shared runtime-safe packages.
- Split web UI from shared logic.
- Create `ui-web` and `ui-mobile` boundaries.

Required refactors:

- Replace direct token reads with an injected token provider.
- Remove browser-only imports from packages that will be reused on mobile.
- Move validation, formatting, request mapping, and auth session logic into shared packages.

Exit criteria:

- `api`, `auth`, and `common` can run without browser globals.
- Shared packages can be imported by a React Native app.

### Phase 2: Mobile App Shell

Duration: 3 to 5 days

Deliverables:

- Create `CueFinderFE/apps/mobile`.
- Configure Expo project, environments, app icons, splash assets, and bundle IDs.
- Add navigation, authentication bootstrap, API base URL configuration, and secure token storage.

Exit criteria:

- App boots on iOS and Android simulators.
- Login, logout, token restore, and protected navigation work.

### Phase 3: MVP Feature Migration

Duration: 2 to 4 weeks

Recommended MVP order:

1. Authentication and profile
2. Cue listing browse and search
3. Cue detail pages
4. Favorites or saved items
5. Messaging
6. Create and edit listing flows

Rules for this phase:

- Reuse API and auth logic from shared packages.
- Rebuild screens with mobile-native components instead of forcing web UI into React Native.
- Keep feature parity focused on the mobile MVP, not full desktop parity on day one.

### Phase 4: Mobile-Specific Capabilities

Duration: 1 to 2 weeks

Deliverables:

- Deep linking
- Push notifications
- Camera and image upload flow
- Better offline and retry behavior for unstable networks

Backend review points:

- Confirm image upload endpoints behave well for mobile uploads.
- Add notification endpoints only if required.
- Keep existing API contracts stable where possible.

### Phase 5: Release Readiness

Duration: 1 week

Deliverables:

- TestFlight pipeline for iOS
- Internal testing track for Android
- App versioning strategy
- Crash logging and analytics
- Store listing assets and privacy disclosures

Exit criteria:

- Production-ready builds generated for both platforms.
- Authentication, listing browse, messaging, and uploads validated on devices.

## Solution Strategy

If the goal is strictly to add two more deliverables, do not create two separate business codebases.

Use this model instead:

- One shared mobile solution in the existing repository
- One codebase for mobile features
- Two platform outputs: iOS and Android

This is the lowest-risk path for cost, maintenance, and feature parity.

## Concrete Work Backlog

### Shared Code Tasks

- Create a token storage interface with web and mobile implementations.
- Centralize API client creation and auth header injection.
- Move all data mapping and validation helpers to shared packages.
- Add shared domain models for users, listings, messages, raffles, and moderation summaries.

### Mobile App Tasks

- Scaffold Expo app in the frontend monorepo.
- Add navigation stacks and auth guard flow.
- Build reusable mobile screen templates.
- Implement browse, detail, profile, message, and create listing screens.
- Add image picker and upload support.

### Backend Tasks

- Validate CORS and auth flows for native mobile clients.
- Review OAuth flows for mobile-specific redirect handling.
- Add push notification support only if included in MVP.

## Risks And Mitigations

### Risk: Shared packages are not actually platform-safe yet

Mitigation:

- Refactor packages before building many mobile screens.
- Add a rule that shared packages cannot access browser globals directly.

### Risk: Web UI components get copied into mobile

Mitigation:

- Split UI into `ui-web` and `ui-mobile`.
- Share logic, not DOM components.

### Risk: OAuth behaves differently on native apps

Mitigation:

- Validate Google and Apple flows early in Phase 2.
- Use Expo-compatible redirect flows and secure token storage.

### Risk: Scope grows to full platform parity too early

Mitigation:

- Lock MVP scope before implementation.
- Defer admin or moderator workflows unless explicitly required on mobile.

## Definition Of Done For The First Release

The first mobile release is complete when:

- Users can sign in and restore sessions securely.
- Users can browse listings, view details, and contact sellers.
- Users can manage their profile and core marketplace activity.
- Shared package reuse is in place for API, auth, and business rules.
- iOS and Android builds are produced from the same mobile workspace.

## Recommended Next Implementation Step

Start with Phase 1, not the app scaffold.

The first actual code change should be introducing a shared storage abstraction and removing direct `localStorage` usage from `CueFinderFE/packages/api` so the API layer can run in both web and mobile environments.