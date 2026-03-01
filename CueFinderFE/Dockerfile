FROM node:18-bullseye AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Install pnpm via corepack (avoids npm install -g runc issues in CI)
RUN corepack enable && corepack prepare pnpm@10 --activate

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./

# Copy all source code (needed for workspace symlinks)
COPY packages ./packages
COPY cuefinderfe/ ./cuefinderfe/

# Install all dependencies (this will set up workspace symlinks correctly)      
RUN pnpm install --frozen-lockfile

# Build the application using pnpm filter to run within workspace context
RUN pnpm --filter @cuefinder/app run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files
COPY --from=build /app/packages/app/build /usr/share/nginx/html

# Copy nginx config
COPY packages/app/nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
