#!/usr/bin/env pwsh
# Run Auth Service with Dapr sidecar
# Usage: .\run.ps1

# Set terminal title - use both methods to ensure it persists
$host.ui.RawUI.WindowTitle = "Auth Service"
[Console]::Title = "Auth Service"

Write-Host "Starting Auth Service with Dapr..." -ForegroundColor Green
Write-Host "Service will be available at: http://localhost:8004" -ForegroundColor Cyan
Write-Host "Dapr HTTP endpoint: http://localhost:3500" -ForegroundColor Cyan
Write-Host "Dapr gRPC endpoint: localhost:50001" -ForegroundColor Cyan
Write-Host ""

dapr run `
  --app-id auth-service `
  --app-port 8004 `
  --dapr-http-port 3500 `
  --dapr-grpc-port 50001 `
  --resources-path .dapr/components `
  --config .dapr/config.yaml `
  --log-level warn `
  -- nodemon src/server.js
