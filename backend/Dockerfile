# VeloFlux Backend Dockerfile
FROM golang:1.23-alpine AS builder

# Install git and ca-certificates
RUN apk add --no-cache git ca-certificates wget

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o veloflux ./cmd/velofluxlb

# Final stage
FROM alpine:latest

# Install ca-certificates and wget for health checks
RUN apk --no-cache add ca-certificates wget

WORKDIR /root/

# Copy the binary from builder stage
COPY --from=builder /app/veloflux .

# Create config directory
RUN mkdir -p /etc/veloflux

# Make binary executable
RUN chmod +x ./veloflux

# Expose ports
EXPOSE 80 443 8080 9000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/metrics || exit 1

# Run the binary
CMD ["./veloflux"]
