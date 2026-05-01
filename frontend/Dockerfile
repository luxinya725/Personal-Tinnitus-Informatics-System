# =========================================
# Stage 1: Build the React.js Application
# =========================================
ARG NODE_VERSION=24.12.0-alpine

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm npm ci

COPY . .

RUN npm run build

# =========================================
# Stage 2: Serve with Caddy and SSL
# =========================================

FROM caddy:alpine

# Install ca-certificates so Caddy's internal CA is trusted
RUN apk add --no-cache ca-certificates

# Copy the Caddyfile configuration
COPY Caddyfile /etc/caddy/Caddyfile

# Copy the static build output from the build stage
COPY --from=builder /app/dist /srv

# Create and set permissions for Caddy data directory (for cert storage)
RUN mkdir -p /data/caddy && chmod -R 777 /data/caddy

# Expose 80 (needed for ACME challenges / internal CA) and 443 for HTTPS
EXPOSE 80
EXPOSE 443

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]