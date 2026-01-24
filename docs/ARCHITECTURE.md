# Auth Service - Architecture Document

## Table of Contents

1. [Overview](#1-overview)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Scope](#12-scope)
   - 1.3 [Service Summary](#13-service-summary)
   - 1.4 [Directory Structure](#14-directory-structure)
   - 1.5 [Key Responsibilities](#15-key-responsibilities)
   - 1.6 [References](#16-references)
2. [System Context](#2-system-context)
   - 2.1 [Context Diagram](#21-context-diagram)
   - 2.2 [External Interfaces](#22-external-interfaces)
   - 2.3 [Dependencies](#23-dependencies)
3. [API Design](#3-api-design)
   - 3.1 [Endpoint Summary](#31-endpoint-summary)
   - 3.2 [Request/Response Specifications](#32-requestresponse-specifications)
   - 3.3 [Error Response Format](#33-error-response-format)
   - 3.4 [Error Code Reference](#34-error-code-reference)
   - 3.5 [Authentication](#35-authentication)
4. [Event Architecture](#4-event-architecture)
   - 4.1 [Event Summary](#41-event-summary)
   - 4.2 [Published Events](#42-published-events)
   - 4.3 [Dapr Configuration](#43-dapr-configuration)
5. [Configuration](#5-configuration)
   - 5.1 [Environment Variables](#51-environment-variables)
   - 5.2 [Secret Management](#52-secret-management)
6. [Security](#6-security)
   - 6.1 [JWT Token Structure](#61-jwt-token-structure)
   - 6.2 [Password Security](#62-password-security)
   - 6.3 [Authorization](#63-authorization)
7. [Observability](#7-observability)
   - 7.1 [Distributed Tracing](#71-distributed-tracing)
   - 7.2 [Structured Logging](#72-structured-logging)
   - 7.3 [Health Checks](#73-health-checks)
8. [Deployment](#8-deployment)
   - 8.1 [Deployment Targets](#81-deployment-targets)

---

## 1. Overview

### 1.1 Purpose

The Auth Service is the central authentication and authorization gateway for the xshopai e-commerce platform. It handles user authentication, JWT token management, password operations, and email verification workflows. The service is **stateless** and relies on the User Service for user data persistence.

### 1.2 Scope

#### In Scope

- User authentication (login/logout)
- User registration with email verification
- JWT token issuance and validation
- Password management (forgot, reset, change)
- Email verification workflow coordination
- Account reactivation workflow
- Account deletion (self-service and admin)
- Role-based authorization middleware
- Authentication event publishing

#### Out of Scope

- User profile storage (handled by User Service)
- Session state storage (stateless JWT-based)
- OAuth/social login (future enhancement)
- Multi-factor authentication (future enhancement)
- Rate limiting (handled at API gateway level)

### 1.3 Service Summary

| Attribute        | Value                           |
| ---------------- | ------------------------------- |
| Service Name     | auth-service                    |
| Tech Stack       | Node.js 20+ / Express 5.1.0     |
| Database         | None (stateless service)        |
| User Data Source | User Service (via Dapr)         |
| Authentication   | JWT (HS256)                     |
| Messaging        | Dapr Pub/Sub (RabbitMQ backend) |
| Secret Store     | Dapr Secret Store               |
| Main Port        | 1004                            |
| Dapr HTTP Port   | 3504                            |
| Dapr gRPC Port   | 50004                           |

### 1.4 Directory Structure

```
auth-service/
├── .dapr/                      # Dapr configuration
│   ├── components/             # Pub/sub, secret store
│   │   ├── event-bus.yaml      # RabbitMQ pub/sub component
│   │   └── secret-store.yaml   # Local secrets component
│   ├── config.yaml             # Dapr configuration
│   └── secrets.json            # Local secrets (gitignored)
├── .github/                    # GitHub workflows and templates
├── .vscode/                    # VS Code settings and tasks
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md         # This file
│   ├── PRD.md                  # Product requirements document
│   └── ...                     # Other documentation
├── src/                        # Application source code
│   ├── clients/                # External service clients
│   │   ├── dapr.secret.manager.js   # Dapr secret store client
│   │   ├── dapr.service.client.js   # Dapr service invocation
│   │   ├── user.service.client.js   # User Service client
│   │   └── index.js                 # Client exports
│   ├── controllers/            # API endpoint handlers
│   │   ├── auth.controller.js       # Authentication handlers
│   │   ├── home.controller.js       # Home/welcome endpoint
│   │   └── operational.controller.js # Health/metrics endpoints
│   ├── core/                   # Core utilities
│   │   ├── config.js           # Configuration management
│   │   ├── errors.js           # Error classes
│   │   ├── logger.js           # Winston logger setup
│   │   └── tokenManager.js     # JWT token utilities
│   ├── middlewares/            # Express middleware
│   │   ├── asyncHandler.js     # Async error handling
│   │   ├── auth.middleware.js  # JWT authentication
│   │   ├── errorHandler.middleware.js  # Centralized error handling
│   │   └── traceContext.middleware.js  # Correlation ID tracking
│   ├── routes/                 # Route definitions
│   │   ├── auth.routes.js      # Authentication routes
│   │   ├── home.routes.js      # Home routes
│   │   └── operational.routes.js # Operational routes
│   ├── validators/             # Input validation
│   │   ├── auth.validator.js   # Auth input validation
│   │   └── config.validator.js # Config validation
│   ├── app.js                  # Express app configuration
│   └── server.js               # Application entry point
├── tests/                      # Test suite
│   ├── unit/                   # Unit tests
│   ├── integration/            # Integration tests
│   ├── e2e/                    # End-to-end tests
│   └── setup.js                # Test setup
├── docker-compose.yml          # Local development setup
├── Dockerfile                  # Container build instructions
├── package.json                # Dependencies and scripts
├── run.ps1                     # Windows run script
└── run.sh                      # Linux/macOS run script
```

### 1.5 Key Responsibilities

1. **User Authentication** - Validate credentials and issue JWT tokens
2. **Token Management** - Sign, verify, and manage JWT token lifecycle
3. **Password Operations** - Handle forgot, reset, and change password workflows
4. **Email Verification** - Coordinate email verification token generation and validation
5. **Account Lifecycle** - Support account reactivation and deletion
6. **Event Publishing** - Publish authentication events for downstream services
7. **JWT Configuration** - Provide JWT secret to BFF services for distributed validation

### 1.6 References

| Document             | Link                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| PRD                  | [docs/PRD.md](./PRD.md)                                               |
| Copilot Instructions | [.github/copilot-instructions.md](../.github/copilot-instructions.md) |

---

## 2. System Context

### 2.1 Context Diagram

```mermaid
flowchart TB
    subgraph Users["<b>👤 USERS</b>"]
        Customer[("👤 Customer")]
        Admin[("🧑‍💼 Admin User")]
    end

    subgraph Clients["<b>📱 CLIENT APPLICATIONS</b>"]
        CustomerUI["🛍️ Customer UI<br/><i>Web/Mobile</i>"]
        AdminUI["🖥️ Admin UI<br/><i>Web Interface</i>"]
    end

    subgraph BFF["<b>🌐 BACKEND FOR FRONTEND</b>"]
        WebBFF["🌐 Web BFF<br/><i>API Gateway</i>"]
    end

    subgraph Platform["<b>🏗️ XSHOPAI PLATFORM</b>"]
        AuthService["🔐 Auth Service<br/><i>Authentication</i>"]
        UserService["👤 User Service<br/><i>User Data</i>"]
        NotificationService["🔔 Notification Service<br/><i>Email Delivery</i>"]
    end

    subgraph Infrastructure["<b>⚙️ INFRASTRUCTURE</b>"]
        RabbitMQ["🐰 RabbitMQ<br/><i>Message Broker</i>"]
        SecretStore["🔑 Secret Store<br/><i>Dapr Secrets</i>"]
    end

    Customer --> CustomerUI
    Admin --> AdminUI
    CustomerUI --> WebBFF
    AdminUI --> WebBFF
    WebBFF --> AuthService

    AuthService -->|"Dapr Service Invocation"| UserService
    AuthService -->|"Dapr Pub/Sub"| RabbitMQ
    RabbitMQ --> NotificationService
    AuthService -->|"Dapr Secrets"| SecretStore
```

### 2.2 External Interfaces

| Interface            | Type             | Description                                   |
| -------------------- | ---------------- | --------------------------------------------- |
| User Service         | Dapr Invocation  | User CRUD operations, credential verification |
| Notification Service | Dapr Pub/Sub     | Receives auth events for email delivery       |
| Audit Service        | Dapr Pub/Sub     | Receives auth events for audit logging        |
| Web BFF              | REST API         | Token validation, JWT config retrieval        |
| Customer UI          | REST API         | Login, register, password reset endpoints     |
| Admin UI             | REST API         | Admin login, user management                  |
| Dapr Secret Store    | Dapr Secrets API | JWT secret retrieval                          |

### 2.3 Dependencies

| Dependency   | Purpose                              | Criticality |
| ------------ | ------------------------------------ | ----------- |
| User Service | User data and credential storage     | Critical    |
| Dapr Sidecar | Service invocation, pub/sub, secrets | Critical    |
| RabbitMQ     | Event messaging                      | High        |
| Secret Store | JWT secret management                | Critical    |

---

## 3. API Design

### 3.1 Endpoint Summary

| Method | Endpoint                  | Description                  | Auth      |
| ------ | ------------------------- | ---------------------------- | --------- |
| GET    | /                         | Service welcome              | None      |
| GET    | /health                   | Health check                 | None      |
| GET    | /health/ready             | Readiness probe              | None      |
| GET    | /health/live              | Liveness probe               | None      |
| GET    | /metrics                  | Service metrics              | None      |
| POST   | /api/auth/login           | User login                   | None      |
| POST   | /api/auth/logout          | User logout                  | None      |
| POST   | /api/auth/register        | User registration            | None      |
| POST   | /api/auth/password/forgot | Request password reset       | None      |
| POST   | /api/auth/password/reset  | Reset password with token    | None      |
| POST   | /api/auth/password/change | Change password              | User JWT  |
| GET    | /api/auth/email/verify    | Verify email with token      | None      |
| POST   | /api/auth/email/resend    | Resend verification email    | None      |
| GET    | /api/auth/verify          | Verify JWT token             | User JWT  |
| GET    | /api/auth/me              | Get current user info        | User JWT  |
| POST   | /api/auth/reactivate      | Request account reactivation | None      |
| GET    | /api/auth/reactivate      | Reactivate with token        | None      |
| DELETE | /api/auth/account         | Delete own account           | User JWT  |
| GET    | /api/auth/config/jwt      | Get JWT configuration        | None      |
| DELETE | /api/admin/auth/users/:id | Admin delete user            | Admin JWT |

**Authentication Types:**

- **None**: Public endpoints (health checks, registration, password reset)
- **User JWT**: Authenticated user operations via JWT (any logged-in user)
- **Admin JWT**: Admin operations requiring `role: admin` in JWT

### 3.2 Request/Response Specifications

#### POST /api/auth/login

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "name": "John Doe",
    "roles": ["customer"],
    "isEmailVerified": true,
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLoginAt": "2024-01-20T14:22:00Z"
  }
}
```

#### POST /api/auth/register

**Request:**

```json
{
  "email": "newuser@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**

```json
{
  "message": "Registration successful, please verify your email.",
  "requiresVerification": true,
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phoneNumber": "+1234567890",
    "isEmailVerified": false,
    "roles": ["customer"]
  }
}
```

#### GET /api/auth/verify

**Response (200 OK):**

```json
{
  "valid": true,
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "roles": ["customer"]
}
```

#### GET /api/auth/me

**Response (200 OK):**

```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "roles": ["customer"],
    "emailVerified": true
  }
}
```

### 3.3 Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-20T14:22:00Z"
}
```

With validation errors:

```json
{
  "error": "Validation failed",
  "statusCode": 400,
  "validationErrors": {
    "field": "password",
    "requirements": ["Password must be between 6 and 25 characters"]
  }
}
```

### 3.4 Error Code Reference

| Status Code | Error                 | Description                               |
| ----------- | --------------------- | ----------------------------------------- |
| 400         | Bad Request           | Invalid input data or validation failure  |
| 401         | Unauthorized          | Invalid credentials or expired token      |
| 403         | Forbidden             | Account deactivated or email not verified |
| 404         | Not Found             | User not found                            |
| 409         | Conflict              | Email already exists                      |
| 500         | Internal Server Error | Unexpected server error                   |
| 503         | Service Unavailable   | User service unavailable                  |

### 3.5 Authentication

The Auth Service uses JWT (JSON Web Tokens) for authentication:

**Token Extraction:**

1. `Authorization: Bearer <token>` header (preferred)
2. `token` HTTP-only cookie (for web clients)

**Token Validation:**

- Signature verification using HS256 algorithm
- Expiration check (configurable, default 1 hour)
- Issuer and audience validation

---

## 4. Event Architecture

### 4.1 Event Summary

Auth Service is a **pure publisher** - it publishes events but does not consume any events.

| Event Type                          | Trigger                 | Consumers            |
| ----------------------------------- | ----------------------- | -------------------- |
| auth.login                          | Successful login        | Audit Service        |
| auth.user.registered                | New user registration   | Notification, Audit  |
| auth.email.verification.requested   | Registration or resend  | Notification Service |
| auth.password.reset.requested       | Forgot password request | Notification Service |
| auth.password.reset.completed       | Password reset success  | Notification, Audit  |
| auth.account.reactivation.requested | Reactivation request    | Notification Service |

### 4.2 Published Events

#### auth.login

Published on successful user login.

```json
{
  "eventId": "1705760520000-abc123",
  "eventType": "auth.login",
  "timestamp": "2024-01-20T14:22:00Z",
  "source": "auth-service",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0...",
    "traceId": "abc123def456",
    "timestamp": "2024-01-20T14:22:00Z",
    "success": true
  },
  "metadata": {
    "traceId": "abc123def456",
    "version": "1.0"
  }
}
```

#### auth.user.registered

Published when a new user registers.

```json
{
  "eventId": "1705760520000-def456",
  "eventType": "auth.user.registered",
  "timestamp": "2024-01-20T14:22:00Z",
  "source": "auth-service",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "email": "newuser@example.com",
    "name": "Jane Smith",
    "firstName": "Jane",
    "lastName": "Smith",
    "registeredAt": "2024-01-20T14:22:00Z",
    "traceId": "ghi789jkl012",
    "timestamp": "2024-01-20T14:22:00Z"
  },
  "metadata": {
    "traceId": "ghi789jkl012",
    "version": "1.0"
  }
}
```

#### auth.email.verification.requested

Published when email verification is needed.

```json
{
  "eventId": "1705760520000-ghi789",
  "eventType": "auth.email.verification.requested",
  "timestamp": "2024-01-20T14:22:00Z",
  "source": "auth-service",
  "data": {
    "userId": "507f1f77bcf86cd799439012",
    "email": "newuser@example.com",
    "username": "Jane Smith",
    "firstName": "Jane",
    "lastName": "Smith",
    "verificationToken": "eyJhbGciOiJIUzI1...",
    "verificationUrl": "http://localhost:3000/verify-email?token=...",
    "expiresAt": "2024-01-21T14:22:00Z",
    "traceId": "mno345pqr678",
    "timestamp": "2024-01-20T14:22:00Z"
  },
  "metadata": {
    "traceId": "mno345pqr678",
    "version": "1.0"
  }
}
```

#### auth.password.reset.requested

Published when password reset is requested.

```json
{
  "eventId": "1705760520000-jkl012",
  "eventType": "auth.password.reset.requested",
  "timestamp": "2024-01-20T14:22:00Z",
  "source": "auth-service",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "resetToken": "eyJhbGciOiJIUzI1...",
    "resetUrl": "http://localhost:3000/reset-password?token=...",
    "expiresAt": "2024-01-20T15:22:00Z",
    "requestIp": "192.168.1.100",
    "traceId": "stu901vwx234",
    "timestamp": "2024-01-20T14:22:00Z"
  },
  "metadata": {
    "traceId": "stu901vwx234",
    "version": "1.0"
  }
}
```

### 4.3 Dapr Configuration

**Pub/Sub Component** (`.dapr/components/event-bus.yaml`):

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

**Secret Store Component** (`.dapr/components/secret-store.yaml`):

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

---

## 5. Configuration

### 5.1 Environment Variables

| Variable                 | Description                | Default                         | Required |
| ------------------------ | -------------------------- | ------------------------------- | -------- |
| NODE_ENV                 | Environment                | development                     | No       |
| PORT                     | HTTP server port           | 1004                            | No       |
| HOST                     | HTTP server host           | 0.0.0.0                         | No       |
| NAME                     | Service name               | auth-service                    | No       |
| VERSION                  | Service version            | 1.0.0                           | No       |
| LOG_LEVEL                | Logging level              | debug                           | No       |
| LOG_FORMAT               | Log format (console/json)  | console                         | No       |
| DAPR_HTTP_PORT           | Dapr sidecar HTTP port     | 3504                            | No       |
| DAPR_HOST                | Dapr sidecar host          | localhost                       | No       |
| DAPR_PUBSUB_NAME         | Pub/sub component name     | event-bus                       | No       |
| DAPR_APP_ID              | Dapr application ID        | auth-service                    | No       |
| DAPR_USER_SERVICE_APP_ID | User service Dapr app ID   | user-service                    | No       |
| USER_SERVICE_URL         | User service base URL      | http://localhost:8002/api/users | No       |
| WEB_UI_BASE_URL          | Web UI base URL for links  | http://localhost:3000           | No       |
| JWT_ALGORITHM            | JWT signing algorithm      | HS256                           | No       |
| JWT_EXPIRATION           | Token expiration (seconds) | 3600                            | No       |
| JWT_ISSUER               | JWT issuer claim           | auth-service                    | No       |
| JWT_AUDIENCE             | JWT audience claim         | xshopai-platform                | No       |

### 5.2 Secret Management

JWT secrets are managed via Dapr Secret Store:

**Local Development** (`.dapr/secrets.json`):

```json
{
  "JWT_SECRET": "your-development-secret-key-at-least-32-characters"
}
```

**Production** (Azure Key Vault):

- Secret Store component configured for Azure Key Vault
- JWT_SECRET retrieved at runtime via Dapr

---

## 6. Security

### 6.1 JWT Token Structure

**Header:**

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload (Claims):**

```json
{
  "sub": "507f1f77bcf86cd799439011",
  "iss": "auth-service",
  "aud": "xshopai-platform",
  "iat": 1705760520,
  "exp": 1705764120,
  "email": "user@example.com",
  "name": "John Doe",
  "roles": ["customer"],
  "emailVerified": true
}
```

**Standard Claims:**

- `sub` - Subject (user ID)
- `iss` - Issuer (auth-service)
- `aud` - Audience (xshopai-platform)
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

**Custom Claims:**

- `email` - User email address
- `name` - User full name
- `roles` - User roles array
- `emailVerified` - Email verification status

### 6.2 Password Security

| Aspect              | Implementation                     |
| ------------------- | ---------------------------------- |
| Hashing algorithm   | bcrypt                             |
| Cost factor         | 12 rounds                          |
| Minimum length      | 6 characters                       |
| Maximum length      | 25 characters                      |
| Required characters | At least one letter and one number |
| Storage             | User Service (hashed only)         |

### 6.3 Authorization

**Role-Based Access Control:**

| Role     | Permissions                                |
| -------- | ------------------------------------------ |
| customer | Login, profile access, password change     |
| admin    | All customer permissions + user management |

**Middleware:**

```javascript
// Authentication middleware
authMiddleware; // Validates JWT token

// Authorization middleware
authorizeRoles('customer', 'admin'); // Requires specified roles
```

---

## 7. Observability

### 7.1 Distributed Tracing

Auth Service uses W3C Trace Context via Dapr:

- **traceparent** header propagated through all requests
- **X-Trace-ID** header included in responses for debugging
- Trace context included in all published events
- Trace context included in all log entries

### 7.2 Structured Logging

**Development Format (console):**

```
[2024-01-20T14:22:00.000Z] [INFO] auth-service [trace:abc12345]: User logged in | {"userId":"507f1f77bcf86cd799439011"}
```

**Production Format (JSON):**

```json
{
  "timestamp": "2024-01-20T14:22:00.000Z",
  "level": "info",
  "service": "auth-service",
  "traceId": "abc123def456",
  "spanId": "789ghi012",
  "message": "User logged in",
  "userId": "507f1f77bcf86cd799439011"
}
```

### 7.3 Health Checks

**GET /health**

```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "timestamp": "2024-01-20T14:22:00Z"
}
```

**GET /health/ready**

```json
{
  "status": "ready",
  "service": "auth-service",
  "timestamp": "2024-01-20T14:22:00Z"
}
```

**GET /health/live**

```json
{
  "status": "alive",
  "service": "auth-service",
  "timestamp": "2024-01-20T14:22:00Z",
  "uptime": 3600
}
```

**GET /metrics**

```json
{
  "service": "auth-service",
  "timestamp": "2024-01-20T14:22:00Z",
  "uptime": {
    "seconds": 3600,
    "formatted": "1h 0m 0s"
  },
  "memory": {
    "heapUsedMB": 45,
    "heapTotalMB": 128,
    "heapUsedPercent": 35.15,
    "rssMB": 85,
    "externalMB": 12,
    "status": "healthy"
  },
  "process": {
    "pid": 12345,
    "nodeVersion": "v20.10.0",
    "platform": "linux",
    "arch": "x64"
  }
}
```

---

## 8. Deployment

### 8.1 Deployment Targets

| Target                   | Configuration                   |
| ------------------------ | ------------------------------- |
| Local Development        | Node.js + Dapr CLI              |
| Docker                   | Dockerfile + docker-compose.yml |
| Azure Container Apps     | See ACA_DEPLOYMENT.md           |
| Azure Kubernetes Service | See AKS_DEPLOYMENT.md           |

**Docker Compose (local):**

```bash
docker-compose up -d
```

**Dapr Run (local development):**

```bash
npm run dev
# or
dapr run --app-id auth-service --app-port 1004 --dapr-http-port 3504 \
  --resources-path ./.dapr/components --config ./.dapr/config.yaml \
  -- node src/server.js
```
