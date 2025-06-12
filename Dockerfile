
# Multi-stage build for SkyPilot LB
FROM golang:1.22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o skypilot-lb \
    ./cmd/skypilotlb

# Final stage - minimal image
FROM scratch

# Copy CA certificates for HTTPS
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

# Copy timezone data
COPY --from=builder /usr/share/zoneinfo /usr/share/zoneinfo

# Copy our binary
COPY --from=builder /app/skypilot-lb /usr/local/bin/skypilot-lb

# Create directory for config
COPY --from=builder /tmp /tmp

# Expose ports
EXPOSE 80 443 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD ["/usr/local/bin/skypilot-lb", "--health-check"]

# Set user (non-root)
USER 65534:65534

# Run the binary
ENTRYPOINT ["/usr/local/bin/skypilot-lb"]
