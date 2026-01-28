# Auth Service - Local Development with Dapr

This guide covers running the Auth Service locally **with Dapr**. Dapr mode enables full functionality including event publishing, secret management, and service invocation.

> **Note:** For quick development without Dapr, see [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Dapr Configuration](#2-dapr-configuration)
3. [Quick Start](#3-quick-start)
4. [Running the Service](#4-running-the-service)
5. [Testing with Dapr](#5-testing-with-dapr)
6. [Event Publishing Verification](#6-event-publishing-verification)
7. [VS Code Debugging](#7-vs-code-debugging)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have:

1. **Completed** [PREREQUISITES.md](./PREREQUISITES.md) setup
2. **Dapr CLI** installed and initialized (`dapr init`)
3. **Docker Desktop** running (required for Dapr components)
4. **RabbitMQ** running (for pub/sub)
5. **User Service** running with Dapr

---

## 2. Dapr Configuration

### Directory Structure

```
.dapr/
├── components/
│   ├── event-bus.yaml        # RabbitMQ pub/sub component
│   └── secret-store.yaml     # Local secrets component
├── config.yaml               # Dapr configuration
└── secrets.json              # Local secrets (gitignored)
```

### Event Bus Component (`.dapr/components/event-bus.yaml`)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: event-bus
spec:
  type: pubsub.rabbitmq
  version: v1
  metadata:
    - name: host
      value: 'amqp://guest:guest@localhost:5672'
    - name: durable
      value: 'true'
    - name: deletedWhenUnused
      value: 'false'
```

### Secret Store Component (`.dapr/components/secret-store.yaml`)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Component
metadata:
  name: secret-store
spec:
  type: secretstores.local.file
  version: v1
  metadata:
    - name: secretsFile
      value: '.dapr/secrets.json'
```

### Secrets File (`.dapr/secrets.json`)

```json
{
  "JWT_SECRET": "your-development-secret-key-at-least-32-characters-long"
}
```

**Important:** This file is gitignored. Create it manually with your own secret.

### Dapr Configuration (`.dapr/config.yaml`)

```yaml
apiVersion: dapr.io/v1alpha1
kind: Configuration
metadata:
  name: authconfig
spec:
  tracing:
    samplingRate: '1'
    zipkin:
      endpointAddress: 'http://localhost:9411/api/v2/spans'
  metric:
    enabled: true
```

---

## 3. Quick Start

### Step 1: Start Infrastructure

```bash
# Start RabbitMQ (if not already running)
docker run -d --name rabbitmq \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management
```

### Step 2: Start User Service with Dapr

```bash
cd ../user-service
npm run dapr:dev
```

**User Service Dapr Ports:**

- App Port: 8002
- Dapr HTTP: 3500
- Dapr gRPC: 50001

> **Note:** All services now use the standard Dapr ports (3500 for HTTP, 50001 for gRPC). This simplifies configuration and works consistently whether running via Docker Compose or individual service runs.

### Step 3: Start Auth Service with Dapr

```bash
cd ../auth-service
npm install
npm run dapr:dev
```

**Auth Service Dapr Ports:**

- App Port: 8003
- Dapr HTTP: 3500
- Dapr gRPC: 50001

---

## 4. Running the Service

### Using npm Script

```bash
npm run dapr:dev
```

This runs the following Dapr command:

```bash
dapr run \
  --app-id auth-service \
  --app-port 8003 \
  --dapr-http-port 3500 \
  --dapr-grpc-port 50001 \
  --resources-path ./.dapr/components \
  --config ./.dapr/config.yaml \
  --log-level warn \
  -- node src/server.js
```

### Using VS Code Task

1. Open Command Palette (Ctrl+Shift+P)
2. Select "Tasks: Run Task"
3. Choose "Start Dapr Sidecar"

### Manual Dapr Run

```bash
dapr run \
  --app-id auth-service \
  --app-port 8003 \
  --dapr-http-port 3500 \
  --resources-path ./.dapr/components \
  --config ./.dapr/config.yaml \
  -- npm run dev
```

**Expected Output:**

```
ℹ️  Starting Dapr with id auth-service. HTTP Port: 3500
✅  You're up and running! Both Dapr and your app are running.
[INFO] auth-service: Auth Service v1.0.0 starting...
[INFO] auth-service: Environment: development
[INFO] auth-service: Dapr mode enabled
[INFO] auth-service: Server listening on http://0.0.0.0:8003
```

### Stopping the Service

```bash
# Using npm script
npm run dapr:stop

# Or manually
dapr stop --app-id auth-service
```

---

## 5. Testing with Dapr

### Via Application Port (Direct)

```bash
curl http://localhost:8003/health
```

### Via Dapr Sidecar (Service Invocation)

```bash
curl http://localhost:3500/v1.0/invoke/auth-service/method/health
```

### User Login (Direct)

```bash
curl -X POST http://localhost:8003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

### User Login (Via Dapr)

```bash
curl -X POST http://localhost:3500/v1.0/invoke/auth-service/method/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

---

## 6. Event Publishing Verification

### View RabbitMQ Management

Open http://localhost:15672 (guest/guest)

1. Navigate to "Queues and Streams" tab
2. Look for queues starting with `auth-service-`
3. Check message counts after operations

### Verify Events Published

After a successful login, you should see the `auth.login` event in RabbitMQ.

**Test Flow:**

```bash
# 1. Login
curl -X POST http://localhost:8003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "SecurePass123"}'

# 2. Check RabbitMQ management UI for new message
# Navigate to: http://localhost:15672/#/queues
```

### Published Events

| Event                               | Trigger                |
| ----------------------------------- | ---------------------- |
| auth.login                          | Successful login       |
| auth.user.registered                | New user registration  |
| auth.email.verification.requested   | Registration, resend   |
| auth.password.reset.requested       | Forgot password        |
| auth.password.reset.completed       | Password reset success |
| auth.account.reactivation.requested | Reactivation request   |

---

## 7. VS Code Debugging

### Debug Configuration (`.vscode/launch.json`)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Auth Service (Dapr)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "dapr",
      "runtimeArgs": [
        "run",
        "--app-id",
        "auth-service",
        "--app-port",
        "8003",
        "--dapr-http-port",
        "3500",
        "--dapr-grpc-port",
        "50001",
        "--resources-path",
        "./.dapr/components",
        "--config",
        "./.dapr/config.yaml",
        "--log-level",
        "warn",
        "--"
      ],
      "program": "${workspaceFolder}/src/server.js",
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

### Debugging Steps

1. Set breakpoints in your code
2. Press F5 or click "Debug Auth Service (Dapr)"
3. Service starts with Dapr sidecar attached
4. Breakpoints will be hit when requests are made

---

## 8. Troubleshooting

### Dapr Sidecar Won't Start

**Issue:** `error getting Dapr runtime: connection refused`

```bash
# Reinitialize Dapr
dapr uninstall
dapr init

# Verify Docker is running
docker info
```

### Events Not Publishing

**Issue:** Events not appearing in RabbitMQ

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Check Dapr pub/sub component
dapr components -k

# Verify component configuration
cat .dapr/components/event-bus.yaml
```

### Secret Store Errors

**Issue:** `JWT_SECRET not found in secret store`

```bash
# Verify secrets file exists
cat .dapr/secrets.json

# Should contain:
# {"JWT_SECRET": "your-secret-here"}
```

### Service Invocation Failures

**Issue:** Cannot invoke User Service

```bash
# Check User Service is running with Dapr
dapr list

# Should show both services:
# auth-service  8003  3500  ...
# user-service  8002  3500  ...
```

### Port Conflicts

**Issue:** `bind: address already in use`

```bash
# Find process on port
# Windows
netstat -ano | findstr :8003

# macOS/Linux
lsof -i :8003

# Kill process or use different port
kill -9 <PID>
```

### Trace Context Issues

**Issue:** Missing trace IDs in logs

Ensure trace context middleware is loaded in `app.js`:

```javascript
app.use(traceContextMiddleware);
```

---

## Service Ports Reference

> **Note:** All services now use the standard Dapr ports (3500 for HTTP, 50001 for gRPC). This simplifies configuration and works consistently whether running via Docker Compose or individual service runs.

| Service      | App Port | Dapr HTTP | Dapr gRPC |
| ------------ | -------- | --------- | --------- |
| Auth Service | 8003     | 3500      | 50001     |
| User Service | 8002     | 3500      | 50001     |

---

## Useful Commands

```bash
# List running Dapr apps
dapr list

# View Dapr logs
dapr logs --app-id auth-service

# Check component status
dapr components -k

# Stop all Dapr apps
dapr stop --app-id auth-service
dapr stop --app-id user-service

# Publish test event
dapr publish --pubsub event-bus --topic test --data '{"test": true}'
```
