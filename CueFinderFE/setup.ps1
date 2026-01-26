@echo off
REM Local development setup for monorepo (Windows)

setlocal enabledelayedexpansion

cd /d "%~dp0"

echo 🚀 Setting up CueFinder FE monorepo...

REM Run build helper to sync old source
echo 📋 Syncing source files...
node scripts\build-helper.js

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
  echo 📦 Installing pnpm...
  call npm install -g pnpm
)

REM Install dependencies
echo 📥 Installing dependencies...
call pnpm install

echo ✅ Setup complete!
echo.
echo Available commands:
echo   pnpm start     - Start development server
echo   pnpm build     - Build for production
echo   pnpm test      - Run tests
echo.
echo Get started with: pnpm start
