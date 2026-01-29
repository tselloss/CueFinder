# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy workspace files and dependency manifests only (better caching)
COPY pnpm-workspace.yaml .npmrc package.json pnpm-lock.yaml* ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/app/package.json ./packages/app/package.json
COPY packages/auth/package.json ./packages/auth/package.json
COPY packages/common/package.json ./packages/common/package.json
COPY packages/ui/package.json ./packages/ui/package.json
COPY cuefinderfe/package.json ./cuefinderfe/package.json

# Install dependencies (monorepo)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy full source after dependencies are cached
COPY packages ./packages
COPY cuefinderfe ./cuefinderfe
COPY scripts ./scripts

# Run build helper to sync old source to new structure
RUN node scripts/build-helper.js

# Debug: Print environment variable
RUN echo "Building with REACT_APP_API_URL=$REACT_APP_API_URL"

# Build the app package
RUN pnpm --filter @cuefinder/app build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files from app package
COPY --from=build /app/packages/app/build /usr/share/nginx/html

# Copy nginx config for serving static React files
COPY packages/app/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
