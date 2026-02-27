FROM node:18-bullseye AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY .npmrc ./

# Copy all source code (needed for workspace symlinks)
COPY packages ./packages
COPY cuefinderfe/ ./cuefinderfe/

# Install dependencies using pnpm via npx (avoids global installs/corepack issues)
RUN npx -y pnpm@8.15.9 install --frozen-lockfile

# Build the application using pnpm invoked via npx
RUN npx -y pnpm@8.15.9 --filter ./cuefinderfe run build

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
