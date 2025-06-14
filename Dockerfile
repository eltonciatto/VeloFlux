
# Multi-stage build for VeloFlux LB
#
# 🚫 Not for Commercial Use Without License
# 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
# 💼 For commercial licensing, visit https://veloflux.com or contact contact@veloflux.com
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata nodejs npm

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build dashboard
RUN npm ci && npm run build

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o veloflux-lb \
    ./cmd/velofluxlb

# Download GeoIP database
FROM alpine:latest AS geoip

RUN apk add --no-cache curl unzip
WORKDIR /geoip

# MaxMind has a free GeoLite2 database but requires registration
# In production, you should download the database with your license key
# For development, we're using a placeholder database
RUN mkdir -p /geoip && \
    echo "This is a placeholder for the GeoIP database" > /geoip/GeoLite2-City.mmdb

# Final stage - minimal yet functional image
FROM gcr.io/distroless/static

USER 65532
COPY --from=builder /app/veloflux-lb /bin/veloflux
COPY --from=builder /app/dist /dist
COPY --from=geoip /geoip /etc/geoip
EXPOSE 80 443 8080 9000
ENTRYPOINT ["/bin/veloflux"]
