# CueFinder Mobile

Shared Expo application for both iOS and Android.

## Purpose

This app is the single mobile client codebase for CueFinder. It is intended to reuse shared packages from the existing monorepo instead of duplicating web business logic.

## Current Status

- Expo app shell created
- secure storage adapter wired into `@cuefinder/storage`
- shared package boundaries prepared for mobile reuse
- navigation and login shell wired to the shared auth package
- home screen loads cue listings through the shared API package

## Local API Configuration

Set the mobile API base URL before running the app locally:

```powershell
$env:EXPO_PUBLIC_API_URL = "http://YOUR_LOCAL_IP:5000/api"
pnpm mobile:start
```

Use your machine's LAN IP, not `localhost`, when testing on a physical device.

## Next Steps

1. Add listing browse and detail flows.
2. Add image upload and messaging screens.
3. Replace placeholder home content with marketplace modules.
4. Validate session restore and logout on device builds.