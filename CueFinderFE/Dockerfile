# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Install pnpm
RUN npm install -g pnpm

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy package.json files for all workspace packages
COPY cuefinderfe/package.json ./cuefinderfe/
COPY packages/api/package.json ./packages/api/
COPY packages/app/package.json ./packages/app/
COPY packages/auth/package.json ./packages/auth/
COPY packages/common/package.json ./packages/common/
COPY packages/ui/package.json ./packages/ui/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy the actual source code for packages
COPY packages ./packages

# Copy cuefinderfe source files
COPY cuefinderfe/ ./cuefinderfe/

# Build the application (run from workspace root)
RUN cd cuefinderfe && pnpm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files
COPY --from=build /app/cuefinderfe/build /usr/share/nginx/html

# Copy nginx config
COPY cuefinderfe/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
