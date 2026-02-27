FROM node:18-bullseye AS build
WORKDIR /app

# Accept API URL as build argument
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Copy workspace configuration files
# Copy only the frontend package for standalone build (avoid workspace/pnpm complexity)
COPY cuefinderfe/package.json cuefinderfe/package-lock.json* ./cuefinderfe/
COPY cuefinderfe/ ./cuefinderfe/

# Install dependencies and build the frontend using npm (standalone)
RUN cd cuefinderfe && npm install --legacy-peer-deps --no-audit
RUN cd cuefinderfe && npm run build

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
