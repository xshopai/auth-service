/**
 * External Clients
 * Exports clients for external service communication
 */

export { default as serviceClient } from './service.client.js';
export { default as userServiceClient } from './user.service.client.js';

// JWT config from environment variables
export const getJwtConfig = () => ({
  secret: process.env.JWT_SECRET,
  algorithm: process.env.JWT_ALGORITHM || 'HS256',
  expiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
  issuer: process.env.JWT_ISSUER || 'auth-service',
  audience: process.env.JWT_AUDIENCE || 'xshopai-platform',
});
