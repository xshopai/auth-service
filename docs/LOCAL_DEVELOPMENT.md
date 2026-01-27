# Auth Service - Local Development Guide

This guide covers running the Auth Service locally **without Dapr**. This mode is useful for quick development and debugging when you don't need the full Dapr sidecar infrastructure.

> **Note:** For development with Dapr (required for event publishing and secrets), see [LOCAL_DEVELOPMENT_DAPR.md](./LOCAL_DEVELOPMENT_DAPR.md).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start](#2-quick-start)
3. [Configuration](#3-configuration)
4. [Running the Service](#4-running-the-service)
5. [Testing the Service](#5-testing-the-service)
6. [Development Workflow](#6-development-workflow)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Prerequisites

Before starting, ensure you have completed the [PREREQUISITES.md](./PREREQUISITES.md) setup.

**Minimum Requirements:**

- Node.js 20.x LTS
- npm 10.x+
- User Service running on port 8002

---

## 2. Quick Start

```bash
# 1. Navigate to auth-service
cd auth-service

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env  # Or create manually (see Configuration section)

# 4. Start User Service (required dependency)
cd ../user-service
npm run dev &
cd ../auth-service

# 5. Start Auth Service
npm run dev
```

The service will be available at: **http://localhost:8003**

---

## 3. Configuration

### Environment Variables (.env)

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

# User Service (direct HTTP mode)
USER_SERVICE_URL=http://localhost:8002/api/users

# JWT Configuration
JWT_SECRET=your-development-secret-key-at-least-32-characters-long
JWT_ALGORITHM=HS256
JWT_EXPIRATION=3600
JWT_ISSUER=auth-service
JWT_AUDIENCE=xshopai-platform

# Web UI (for email links)
WEB_UI_BASE_URL=http://localhost:3000
```

### Important Notes

1. **JWT_SECRET**: In non-Dapr mode, JWT secret is read from environment variable. In Dapr mode, it's read from the secret store.

2. **USER_SERVICE_URL**: Direct HTTP calls are made to User Service when not using Dapr service invocation.

3. **Event Publishing**: Events are **not published** in non-Dapr mode. Use Dapr mode for full functionality.

---

## 4. Running the Service

### Development Mode (with hot reload)

```bash
npm run dev
```

This starts the service with nodemon for automatic restarts on file changes.

### Standard Mode

```bash
npm start
```

### Debug Mode (VS Code)

1. Open VS Code in auth-service folder
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Launch Auth Service" configuration
4. Press F5

**Expected Output:**

```
[INFO] auth-service: Auth Service v1.0.0 starting...
[INFO] auth-service: Environment: development
[INFO] auth-service: Server listening on http://0.0.0.0:8003
```

---

## 5. Testing the Service

### Health Check

```bash
curl http://localhost:8003/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-20T14:22:00Z"
}
```

### User Registration

```bash
curl -X POST http://localhost:8003/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### User Login

```bash
curl -X POST http://localhost:8003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "User",
    "roles": ["customer"]
  }
}
```

### Token Verification

```bash
# Use the token from login response
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:8003/api/auth/verify \
  -H "Authorization: Bearer $TOKEN"
```

### Get Current User

```bash
curl http://localhost:8003/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 6. Development Workflow

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# With coverage
npm run test:coverage
```

### Linting

```bash
# Check for issues
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Project Scripts

| Script              | Description                     |
| ------------------- | ------------------------------- |
| `npm start`         | Start production server         |
| `npm run dev`       | Start with nodemon (hot reload) |
| `npm test`          | Run all tests                   |
| `npm run test:unit` | Run unit tests                  |
| `npm run lint`      | Run ESLint                      |
| `npm run lint:fix`  | Auto-fix lint issues            |

---

## 7. Troubleshooting

### Service Won't Start

**Issue:** `Error: Cannot find module 'express'`

```bash
# Solution
rm -rf node_modules
npm install
```

**Issue:** `Error: EADDRINUSE: address already in use :::8003`

```bash
# Find and kill process on port 8003
# Windows
netstat -ano | findstr :8003
taskkill /F /PID <PID>

# Linux/macOS
lsof -i :8003
kill -9 <PID>
```

### Cannot Connect to User Service

**Issue:** `ECONNREFUSED 127.0.0.1:8002`

Ensure User Service is running:

```bash
cd ../user-service
npm run dev
```

### JWT Token Issues

**Issue:** `JsonWebTokenError: invalid signature`

Verify JWT_SECRET is consistent:

1. Check `.env` file has JWT_SECRET set
2. Ensure the same secret is used for both sign and verify

**Issue:** `TokenExpiredError: jwt expired`

Token has expired. Login again to get a fresh token or increase `JWT_EXPIRATION` in `.env`.

### Validation Errors

**Issue:** `400 Bad Request` with validation errors

Check request body format:

- Email must be valid format
- Password: 6-25 characters, at least one letter and one number
- Required fields: email, password (for login/register)

---

## Limitations in Non-Dapr Mode

When running without Dapr:

1. **No Event Publishing** - Auth events (login, register, etc.) are not published
2. **No Secret Store** - JWT secret must be in environment variables
3. **Direct HTTP Calls** - Uses direct HTTP to User Service instead of Dapr service invocation
4. **No Distributed Tracing** - Limited to local logging only

For full functionality including event publishing and distributed tracing, use [Dapr mode](./LOCAL_DEVELOPMENT_DAPR.md).
