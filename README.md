<div align="center">

# 🔐 Auth Service

**Enterprise-grade authentication microservice for the xshopai e-commerce platform**

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.1+-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Dapr](https://img.shields.io/badge/Dapr-Enabled-0D597F?style=for-the-badge&logo=dapr&logoColor=white)](https://dapr.io)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Getting Started](#-getting-started) •
[Documentation](#-documentation) •
[API Reference](docs/PRD.md) •
[Contributing](#-contributing)

</div>

---

## 🎯 Overview

The **Auth Service** is a critical microservice responsible for user authentication, JWT token management, session handling, and access control across the xshopai platform. Built with scalability and reliability in mind, it supports multi-cloud deployments and integrates seamlessly with the broader microservices ecosystem.

---

## ✨ Key Features

<table>
<tr>
<td width="50%">

### 🔑 Authentication

- JWT token generation & validation
- User login & registration flows
- Token refresh mechanism
- Session management

</td>
<td width="50%">

### 🛡️ Security

- Password hashing (bcrypt)
- Rate limiting protection
- Role-based access control (RBAC)
- Comprehensive audit logging

</td>
</tr>
<tr>
<td width="50%">

### 📡 Event-Driven Architecture

- CloudEvents 1.0 specification
- Pub/sub messaging via Dapr
- Auth event publishing
- Cross-service synchronization

</td>
<td width="50%">

### 🔒 Token Management

- Access & refresh tokens
- Token blacklisting support
- Configurable expiration
- Secure token storage

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (optional)
- Dapr CLI (for production-like setup)

### Quick Start with Docker Compose

```bash
# Clone the repository
git clone https://github.com/xshopai/auth-service.git
cd auth-service

# Start all services
docker-compose up -d

# Verify the service is healthy
curl http://localhost:1004/health
```

### Local Development Setup

<details>
<summary><b>🔧 Without Dapr (Simple Setup)</b></summary>

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start the service
npm run dev
```

📖 See [Local Development Guide](docs/LOCAL_DEVELOPMENT.md) for detailed instructions.

</details>

<details>
<summary><b>⚡ With Dapr (Production-like)</b></summary>

```bash
# Ensure Dapr is initialized
dapr init

# Start with Dapr sidecar
npm run dev:dapr

# Or use platform-specific scripts
./run.sh       # Linux/Mac
.\run.ps1      # Windows
```

📖 See [Dapr Development Guide](docs/LOCAL_DEVELOPMENT_DAPR.md) for detailed instructions.

</details>

---

## 📚 Documentation

| Document                                                         | Description                                          |
| :--------------------------------------------------------------- | :--------------------------------------------------- |
| 📘 [Local Development](docs/LOCAL_DEVELOPMENT.md)                | Step-by-step local setup without Dapr                |
| ⚡ [Local Development with Dapr](docs/LOCAL_DEVELOPMENT_DAPR.md) | Local setup with full Dapr integration               |
| 📋 [Product Requirements](docs/PRD.md)                           | Complete API specification and business requirements |
| 🏗️ [Architecture](docs/ARCHITECTURE.md)                          | System design, patterns, and data flows              |
| 🔐 [Security](.github/SECURITY.md)                               | Security policies and vulnerability reporting        |

---

## 🧪 Testing

We maintain high code quality standards with comprehensive test coverage.

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

| Metric        | Status               |
| :------------ | :------------------- |
| Unit Tests    | ✅ Passing           |
| Code Coverage | ✅ Target 80%+       |
| Security Scan | ✅ 0 vulnerabilities |

---

## 🏗️ Project Structure

```
auth-service/
├── 📁 src/                       # Application source code
│   ├── 📁 controllers/           # REST API endpoints
│   ├── 📁 middlewares/           # Authentication, logging, tracing
│   ├── 📁 validators/            # Input validation
│   ├── 📁 routes/                # Route definitions
│   ├── 📁 clients/               # External service clients
│   └── 📁 core/                  # Config, logger, errors
├── 📁 tests/                     # Test suite
│   ├── 📁 unit/                  # Unit tests
│   ├── 📁 integration/           # Integration tests
│   └── 📁 e2e/                   # End-to-end tests
├── 📁 .dapr/                     # Dapr configuration
│   ├── 📁 components/            # Pub/sub, secrets, state stores
│   └── 📄 config.yaml            # Dapr runtime configuration
├── 📁 docs/                      # Documentation
├── 📄 docker-compose.yml         # Local containerized environment
├── 📄 Dockerfile                 # Production container image
└── 📄 package.json               # Node.js dependencies
```

---

## 🔧 Technology Stack

| Category          | Technology                           |
| :---------------- | :----------------------------------- |
| 🟢 Runtime        | Node.js 20+                          |
| 🌐 Framework      | Express 5.1+                         |
| 📨 Messaging      | Dapr Pub/Sub (RabbitMQ backend)      |
| 📋 Event Format   | CloudEvents 1.0 Specification        |
| 🔐 Authentication | JWT Tokens + bcrypt password hashing |
| 🧪 Testing        | Jest with coverage reporting         |
| 📊 Observability  | Winston structured logging           |

---

## ⚡ Quick Reference

```bash
# 🐳 Docker Compose
docker-compose up -d              # Start all services
docker-compose down               # Stop all services
docker-compose logs -f auth       # View logs

# 🟢 Local Development
npm run dev                       # Run without Dapr
npm run dev:dapr                  # Run with Dapr sidecar
npm run debug:dapr                # Debug with Dapr

# 🧪 Testing
npm test                          # Run all tests
npm run test:unit                 # Run unit tests
npm run test:coverage             # Run with coverage

# 🔍 Health Check
curl http://localhost:1004/health
curl http://localhost:1004/health/ready
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Write** tests for your changes
4. **Run** the test suite
   ```bash
   npm test && npm run lint
   ```
5. **Commit** your changes
   ```bash
   git commit -m 'feat: add amazing feature'
   ```
6. **Push** to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open** a Pull Request

Please ensure your PR:

- ✅ Passes all existing tests
- ✅ Includes tests for new functionality
- ✅ Follows the existing code style
- ✅ Updates documentation as needed

---

## 🆘 Support

| Resource         | Link                                                                      |
| :--------------- | :------------------------------------------------------------------------ |
| 🐛 Bug Reports   | [GitHub Issues](https://github.com/xshopai/auth-service/issues)           |
| 📖 Documentation | [docs/](docs/)                                                            |
| 📋 API Reference | [docs/PRD.md](docs/PRD.md)                                                |
| 💬 Discussions   | [GitHub Discussions](https://github.com/xshopai/auth-service/discussions) |

---

## 📄 License

This project is part of the **xshopai** e-commerce platform.  
Licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**[⬆ Back to Top](#-auth-service)**

Made with ❤️ by the xshopai team

</div>
