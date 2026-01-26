#!/bin/bash
# Local development setup for monorepo

cd "$(dirname "$0")"

echo "🚀 Setting up CueFinder FE monorepo..."

# Run build helper to sync old source
echo "📋 Syncing source files..."
node scripts/build-helper.js

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

echo "✅ Setup complete!"
echo ""
echo "Available commands:"
echo "  pnpm start     - Start development server"
echo "  pnpm build     - Build for production"
echo "  pnpm test      - Run tests"
echo ""
echo "Get started with: pnpm start"
