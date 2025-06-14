# Multi-stage build para VeloFlux LB
FROM golang:1.23 AS builder

# Instalar dependências
RUN apt-get update && apt-get install -y git ca-certificates tzdata nodejs npm

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de módulo Go
COPY go.mod go.sum ./

# Download de dependências
RUN go mod download

# Copiar código-fonte
COPY . .

# Executar go mod tidy para garantir consistência das dependências
RUN go mod tidy

# Build da interface web
RUN npm ci && npm run build

# Compilar o binário
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o veloflux-lb \
    ./cmd/velofluxlb

# Download da base de dados GeoIP
FROM alpine:latest AS geoip
RUN apk add --no-cache curl unzip
WORKDIR /geoip
RUN mkdir -p /geoip && \
    echo "This is a placeholder for the GeoIP database" > /geoip/GeoLite2-City.mmdb

# Estágio final - imagem mínima
FROM gcr.io/distroless/static

USER nonroot:nonroot
COPY --from=builder /app/veloflux-lb /bin/veloflux
COPY --from=builder /app/dist /dist
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=geoip /geoip /etc/geoip

# Criar diretórios necessários com as permissões adequadas
COPY --from=builder --chown=nonroot:nonroot /app/config /etc/veloflux

EXPOSE 80 443 8080 9000
ENTRYPOINT ["/bin/veloflux"]
