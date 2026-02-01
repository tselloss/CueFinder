# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package files first for better caching
COPY cuefinderfe/package*.json ./cuefinderfe/

# Change to cuefinderfe directory and install dependencies
WORKDIR /app/cuefinderfe
RUN npm install

# Copy source files
COPY cuefinderfe/ ./

# Build the application
RUN npm run build

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
