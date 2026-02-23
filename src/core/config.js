/**
 * Configuration module for auth-service
 * Centralizes all environment-based configuration (non-sensitive only)
 *
 * For sensitive secrets (JWT secrets), use:
 * - import { getJwtConfig } from '../clients/index.js'
 */

export default {
  service: {
    name: process.env.SERVICE_NAME || process.env.NAME || 'auth-service',
    version: process.env.VERSION || '1.0.0',
    port: parseInt(process.env.PORT, 10) || 8004,
    host: process.env.HOST || '0.0.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Service Invocation Mode
  serviceInvocationMode: process.env.SERVICE_INVOCATION_MODE || 'http',

  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    format: process.env.LOG_FORMAT || 'console',
    toConsole: process.env.LOG_TO_CONSOLE === 'true',
    toFile: process.env.LOG_TO_FILE === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/auth-service.log',
  },

  observability: {
    // W3C Trace Context headers (managed by Dapr)
    traceContextHeader: 'traceparent',
    traceIdHeader: 'X-Trace-ID', // Custom header for response debugging
  },

  dapr: {
    httpPort: parseInt(process.env.DAPR_HTTP_PORT, 10) || 3500,
    grpcPort: parseInt(process.env.DAPR_GRPC_PORT, 10) || 50001,
    host: process.env.DAPR_HOST || 'localhost',
    pubsubName: process.env.DAPR_PUBSUB_NAME || 'pubsub',
    appId: process.env.DAPR_APP_ID || 'auth-service',
  },

  services: {
    userService: {
      url: process.env.USER_SERVICE_URL || 'http://localhost:8002',
      appId: process.env.USER_SERVICE_APP_ID || 'user-service',
    },
    webUI: {
      baseUrl: process.env.WEB_UI_BASE_URL || 'http://localhost:3000',
    },
  },
};
