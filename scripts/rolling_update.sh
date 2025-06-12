#!/usr/bin/env bash
set -euo pipefail

NODES=(vflux-1 vflux-2)
for NODE in "${NODES[@]}"; do
  echo "Draining $NODE"
  curl -X POST "http://$NODE:9090/admin/drain" || true
  echo "Waiting for $NODE to stop"
  while docker inspect -f '{{.State.Running}}' "$NODE" 2>/dev/null | grep -q true; do
    sleep 2
  done
  echo "Starting new $NODE"
  docker compose up -d --pull=always "$NODE"
  echo "$NODE updated"
done
