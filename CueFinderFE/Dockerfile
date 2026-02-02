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

# Copy cuefinderfe package files
COPY cuefinderfe/package.json ./cuefinderfe/

# Copy packages folder if it exists (for workspace dependencies)
COPY packages ./packages

# Install all dependencies (workspace + cuefinderfe)
RUN pnpm install --frozen-lockfile

# Copy cuefinderfe source files
COPY cuefinderfe/ ./cuefinderfe/

# Build the application
WORKDIR /app/cuefinderfe
RUN pnpm run build

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
