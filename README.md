# 🔐 Auth Service

Authentication and authorization microservice for xshop.ai - handles user authentication, JWT token management, session handling, and access control.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Dapr CLI** 1.16+ ([Install Guide](https://docs.dapr.io/getting-started/install-dapr-cli/))

### Setup

**1. Clone & Install**
```bash
git clone https://github.com/xshopai/auth-service.git
cd auth-service
npm install
```

**2. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit .env - update these values:
# JWT_SECRET=your-secret-key-change-in-production
# JWT_ALGORITHM=HS256
# JWT_EXPIRATION=3600
```

**3. Initialize Dapr**
```bash
# First time only
dapr init
```

**4. Run Service**
```bash
# Start with Dapr (recommended)
npm run dev

# Or use platform-specific scripts
./run.sh       # Linux/Mac
.\run.ps1      # Windows
```

**5. Verify**
```bash
# Check health
curl http://localhost:1004/health

# Should return: {"status":"UP","service":"auth-service"...}

# Via Dapr
curl http://localhost:3504/v1.0/invoke/auth-service/method/health
```

### Common Commands

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Lint code
npm run lint

# Debug mode
npm run dev:debug

# Production mode
npm start
```

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [📖 Developer Guide](docs/DEVELOPER_GUIDE.md) | Local setup, debugging, daily workflows |
| [📘 Technical Reference](docs/TECHNICAL.md) | Architecture, security, monitoring |
| [🤝 Contributing](docs/CONTRIBUTING.md) | Contribution guidelines and workflow |

**API Documentation**: See `src/routes/` for endpoint definitions and `tests/integration/` for API contract examples.

## ⚙️ Configuration

### Required Environment Variables

```bash
# Service
NODE_ENV=development              # Environment: development, production, test
PORT=1004                         # HTTP server port

# Security
JWT_SECRET=your-secret-key        # JWT signing secret (32+ characters)
JWT_ALGORITHM=HS256               # JWT algorithm
JWT_EXPIRATION=3600               # Token expiration (seconds)

# Dapr
DAPR_HTTP_PORT=3504              # Dapr sidecar HTTP port
DAPR_GRPC_PORT=50004             # Dapr sidecar gRPC port
DAPR_APP_ID=auth-service         # Dapr application ID
```

See [.env.example](.env.example) for complete configuration options.

## ✨ Key Features

- JWT token generation and validation
- User authentication and login
- Token refresh mechanism
- Session management
- Role-based access control (RBAC)
- Password validation and security
- Rate limiting for authentication endpoints
- Comprehensive audit logging
- Multi-factor authentication support (future)

## 🔗 Related Services

- [user-service](https://github.com/xshopai/user-service) - User profile management
- [admin-service](https://github.com/xshopai/admin-service) - Admin operations
- [audit-service](https://github.com/xshopai/audit-service) - Audit logging

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/xshopai/auth-service/issues)
- **Discussions**: [GitHub Discussions](https://github.com/xshopai/auth-service/discussions)
- **Documentation**: [docs/](docs/)
