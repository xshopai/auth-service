#!/bin/bash

# Auth Service - Run with Dapr

echo "Starting Auth Service with Dapr..."
echo "Service will be available at: http://localhost:8004"
echo "Dapr HTTP endpoint: http://localhost:3504"
echo "Dapr gRPC endpoint: localhost:50004"
echo ""

dapr run \
  --app-id auth-service \
  --app-port 8004 \
  --dapr-http-port 3504 \
  --dapr-grpc-port 50004 \
  --log-level info \
  --config ./.dapr/config.yaml \
  --resources-path ./.dapr/components \
  -- node src/server.js
