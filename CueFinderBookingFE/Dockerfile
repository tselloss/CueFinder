# Build stage
FROM node:18-alpine AS build
WORKDIR /app

ARG VITE_BOOKING_API_BASE_URL
ARG VITE_AUTH_API_BASE_URL
ENV VITE_BOOKING_API_BASE_URL=$VITE_BOOKING_API_BASE_URL
ENV VITE_AUTH_API_BASE_URL=$VITE_AUTH_API_BASE_URL

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
RUN apk add --no-cache curl

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
