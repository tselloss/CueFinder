---
applyTo: "CueFinderFE/**/*.{js,jsx,ts,tsx,json,md}"
description: "Use when planning, scaffolding, refactoring, or implementing CueFinder mobile app work for iOS, Android, Expo, React Native, or shared frontend packages."
---

# CueFinder Mobile App Instructions

## Primary Decision

Build one shared mobile app codebase that targets both iOS and Android.

Do not create duplicate business logic for each platform unless the user explicitly asks for separate native implementations.

## Where Mobile Code Belongs

- Put mobile app code in the existing `CueFinderFE` workspace.
- Prefer an `apps/mobile` structure under `CueFinderFE`.
- Keep reusable logic in shared packages.

## What Must Be Shared

Share these areas whenever possible:

- API clients
- auth/session logic
- request and response mapping
- validation
- domain models
- pure utility functions

## What Must Not Be Shared Directly

Do not directly reuse these from web code in mobile code:

- DOM components
- browser routing primitives
- `localStorage`
- `window` and `document`
- Radix UI and other browser-only libraries
- Bootstrap or layout assumptions tied to desktop web

If needed, extract the logic and rebuild the presentation layer with React Native components.

## Required Refactoring Pattern

When moving existing web functionality toward mobile reuse:

1. Extract business logic from screens into shared packages.
2. Replace direct browser storage access with an abstraction.
3. Keep web and mobile UI implementations separate.
4. Centralize API configuration and auth header handling.
5. Keep imports flowing from package boundaries instead of deep app-relative paths.

## Storage Rule

Shared packages must never call `localStorage` directly.

Use an injected storage contract instead:

- web implementation uses `localStorage`
- mobile implementation uses secure device storage

## Authentication Rule

- Prefer one shared auth service layer for web and mobile.
- Mobile tokens must be stored in secure storage.
- Validate Google and Apple login flows early when native mobile work begins.

## UI Rule

- Mobile screens should feel native and mobile-first.
- Do not try to port Radix or browser-specific component patterns into React Native.
- If a component is visual only, implement platform-specific versions and keep the shared logic outside the component.

## API Rule

- Reuse the current backend contracts first.
- Keep mobile-specific API changes minimal and justified.
- Preserve REST conventions already used in the backend.

## MVP Priority

When scoping mobile work, prioritize in this order unless the user asks otherwise:

1. authentication
2. listing browse and detail
3. profile
4. messaging
5. image upload
6. listing creation and editing

## Implementation Bias

When proposing changes, prefer the smallest refactor that improves cross-platform reuse.

Good examples:

- extracting a shared token provider
- moving DTO mapping into `packages/common` or `packages/domain`
- creating `ui-web` and `ui-mobile`

Bad examples:

- copying web pages into the mobile app
- adding browser globals into shared packages
- creating separate API clients for web and mobile without a platform need