# Auth Service - Prerequisites

This document outlines all prerequisites required to set up and run the Auth Service locally.

---

## Table of Contents

1. [Runtime Requirements](#1-runtime-requirements)
2. [Development Tools](#2-development-tools)
3. [Infrastructure Services](#3-infrastructure-services)
4. [Dependent Services](#4-dependent-services)
5. [Environment Configuration](#5-environment-configuration)
6. [Verification Checklist](#6-verification-checklist)

---

## 1. Runtime Requirements

### Node.js

| Requirement | Version  |
| ----------- | -------- |
| Node.js     | 20.x LTS |
| npm         | 10.x+    |

**Installation:**

```bash
# Windows (using winget)
winget install OpenJS.NodeJS.LTS

# macOS (using Homebrew)
brew install node@20

# Verify installation
node --version   # Should show v20.x.x
npm --version    # Should show 10.x.x
```

### Dapr CLI (Required for Dapr mode)

| Requirement | Version |
| ----------- | ------- |
| Dapr CLI    | 1.13+   |

**Installation:**

```bash
# Windows (using PowerShell)
powershell -Command "iwr -useb https://raw.githubusercontent.com/dapr/cli/master/install/install.ps1 | iex"

# macOS/Linux
curl -fsSL https://raw.githubusercontent.com/dapr/cli/master/install/install.sh | /bin/bash

# Initialize Dapr
dapr init

# Verify installation
dapr --version   # Should show CLI version: 1.13.x
```

---

## 2. Development Tools

### Required

| Tool    | Purpose           | Installation                                |
| ------- | ----------------- | ------------------------------------------- |
| Git     | Version control   | `winget install Git.Git`                    |
| VS Code | IDE (recommended) | `winget install Microsoft.VisualStudioCode` |

### Recommended VS Code Extensions

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Thunder Client / REST Client** - API testing
- **Docker** - Container management
- **GitLens** - Git integration

---

## 3. Infrastructure Services

### Docker Desktop (Recommended)

Docker Desktop provides an easy way to run infrastructure services.

**Installation:**

```bash
# Windows
winget install Docker.DockerDesktop

# macOS
brew install --cask docker
```

### RabbitMQ

Auth Service publishes events via RabbitMQ (through Dapr pub/sub).

**Option A: Docker (Recommended)**

```bash
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management

# Access management UI at http://localhost:15672
# Default credentials: guest/guest
```

**Option B: Using shared docker-compose**

```bash
cd scripts/docker-compose
docker-compose -f docker-compose.infrastructure.yml up -d rabbitmq
```

---

## 4. Dependent Services

Auth Service requires User Service for user data operations.

### User Service

| Dependency   | Purpose                | Required For        |
| ------------ | ---------------------- | ------------------- |
| User Service | User CRUD, credentials | All auth operations |

**Start User Service:**

```bash
cd ../user-service

# Without Dapr
npm run dev

# With Dapr
npm run dapr:dev
```

**User Service Ports:**

- App Port: 8002
- Dapr HTTP: 3502
- Dapr gRPC: 50002

---

## 5. Environment Configuration

### Environment Variables

Create a `.env` file in the auth-service root:

```env
# Service Configuration
NODE_ENV=development
PORT=8003
HOST=0.0.0.0
NAME=auth-service
VERSION=1.0.0

# Logging
LOG_LEVEL=debug
LOG_FORMAT=console

# Dapr Configuration
DAPR_HTTP_PORT=3504
DAPR_HOST=localhost
DAPR_PUBSUB_NAME=event-bus
DAPR_APP_ID=auth-service
DAPR_USER_SERVICE_APP_ID=user-service

# User Service
USER_SERVICE_URL=http://localhost:8002/api/users

# JWT Configuration
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
JWT_ISSUER=auth-service
JWT_AUDIENCE=xshopai-platform

# Web UI (for email links)
WEB_UI_BASE_URL=http://localhost:3000
```

### Dapr Secrets Configuration

Create `.dapr/secrets.json` file:

```json
{
  "JWT_SECRET": "your-development-secret-key-at-least-32-characters-long"
}
```

**Important:** This file is gitignored and must be created manually.

---

## 6. Verification Checklist

Run through this checklist to verify your setup:

### Runtime Verification

```bash
# Node.js
node --version
# Expected: v20.x.x

# npm
npm --version
# Expected: 10.x.x

# Dapr CLI (for Dapr mode)
dapr --version
# Expected: CLI version: 1.13.x
```

### Infrastructure Verification

```bash
# RabbitMQ (if using Docker)
docker ps | grep rabbitmq
# Should show running container

# RabbitMQ management UI
curl -s http://localhost:15672 > /dev/null && echo "RabbitMQ OK" || echo "RabbitMQ NOT OK"
```

### Dependency Installation

```bash
# Install npm dependencies
cd auth-service
npm install
```

### Configuration Verification

```bash
# Verify .env exists
ls -la .env
# Should show the file

# Verify Dapr secrets
ls -la .dapr/secrets.json
# Should show the file
```

### User Service Verification (Required)

```bash
# Check if User Service is running
curl http://localhost:8002/health
# Should return healthy status
```

---

## Quick Start Commands

Once prerequisites are met:

```bash
# 1. Clone and navigate
cd auth-service

# 2. Install dependencies
npm install

# 3. Create .env file (see Environment Variables section above)

# 4. Create Dapr secrets file
mkdir -p .dapr
echo '{"JWT_SECRET": "your-development-secret-key-at-least-32-characters"}' > .dapr/secrets.json

# 5. Start User Service (in another terminal)
cd ../user-service
npm run dev

# 6. Start Auth Service
npm run dev           # Without Dapr
# or
npm run dapr:dev      # With Dapr
```

---

## Troubleshooting

### Issue: "Cannot find module"

```bash
# Solution: Reinstall dependencies
rm -rf node_modules
npm install
```

### Issue: "ECONNREFUSED" when connecting to User Service

```bash
# Solution: Ensure User Service is running
cd ../user-service
npm run dev
```

### Issue: "JWT_SECRET not found"

```bash
# Solution: Create Dapr secrets file
echo '{"JWT_SECRET": "your-secret-key-here"}' > .dapr/secrets.json
```

### Issue: Dapr sidecar not starting

```bash
# Solution: Reinitialize Dapr
dapr uninstall
dapr init
```
