#!/bin/bash

# Auth Service - Run with Dapr Pub/Sub

echo "Starting Auth Service (Dapr Pub/Sub)..."
echo "Service will be available at: http://localhost:8004"
echo "Dapr HTTP endpoint: http://localhost:3504"
echo "Dapr gRPC endpoint: localhost:50004"
echo ""

# Kill any processes using required ports (prevents "address already in use" errors)
for PORT in 8004 3504 50004; do
    for pid in $(netstat -ano 2>/dev/null | grep ":$PORT" | grep LISTENING | awk '{print $5}' | sort -u); do
        echo "Killing process $pid on port $PORT..."
        taskkill //F //PID $pid 2>/dev/null
    done
done

dapr run \
  --app-id auth-service \
  --app-port 8004 \
  --dapr-http-port 3504 \
  --dapr-grpc-port 50004 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- node src/server.js
