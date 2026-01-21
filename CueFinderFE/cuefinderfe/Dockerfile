# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Debug: Print environment variable
RUN echo "Building with REACT_APP_API_URL=$REACT_APP_API_URL"

# Build the React application
RUN npm run build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files
COPY --from=build /app/build /usr/share/nginx/html

# Copy public static files (HTML, images, etc)
COPY --from=build /app/public /usr/share/nginx/html

# Copy nginx config for serving static React files
COPY nginx-frontend.conf /etc/nginx/conf.d/default.conf

# Expose standard HTTP port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
