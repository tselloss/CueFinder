# BookBilliard Deployment Notes

## Services
- Booking backend: CueFinderBookingBE (port 5202)
- Booking frontend: CueFinderBookingFE (port 3001)
- Uses existing CueFinder Postgres database (no schema changes).

## Local Docker Compose
Use the shared network from the main stack.

- Start core stack: `docker compose up -d`
- Start booking stack: `docker compose -f docker-compose.booking.yml up -d --build`

## Required environment values
- Booking API base URL (frontend build): `VITE_BOOKING_API_BASE_URL`
- Auth API base URL (frontend build): `VITE_AUTH_API_BASE_URL`
- Booking DB connection: `ConnectionStrings__BookingConnection`

## Production domain layout (example)
- https://billiardscuefinder.com -> CueFinder FE + BE
- https://bookbilliard.com -> Booking FE
- https://api.bookbilliard.com -> Booking BE

## Example reverse proxy (Nginx)
```
server {
  listen 443 ssl;
  server_name bookbilliard.com;
  location / {
    proxy_pass http://booking-frontend:80;
  }
}

server {
  listen 443 ssl;
  server_name api.bookbilliard.com;
  location / {
    proxy_pass http://booking-backend:5202;
  }
}
```

## Tenant scoping
Pass the club record id when needed:
- Header: `X-Club-Record-Id: <record-guid>`
- Or JWT claim: `recordId`
