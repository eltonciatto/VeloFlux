# Quick Start Guide

Follow these steps to spin up VeloFlux locally.

1. **Clone the repository**

   ```bash
   git clone https://github.com/eltonciatto/VeloFlux.git
   cd VeloFlux
   ```

2. **Build the binary**

   ```bash
   go build -o veloflux ./cmd/velofluxlb
   ```

3. **Run with the sample configuration**

   ```bash
   ./veloflux -config config/config.example.yaml
   ```

4. **Access the dashboard**

   Visit <http://localhost> to confirm the load balancer is running.

For Docker users, simply run `docker-compose up -d` and the whole stack will be
started with defaults.
