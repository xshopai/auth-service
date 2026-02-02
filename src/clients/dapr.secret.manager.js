/**
 * Dapr Secret Management Service
 * Provides secret management using Dapr's secret store building block.
 *
 * Secret Naming Convention:
 *   Local (.dapr/secrets.json): UPPER_SNAKE_CASE (e.g., JWT_SECRET)
 *   Azure Key Vault: lower-kebab-case (e.g., jwt-secret)
 *   The mapping is handled by Dapr component configuration in Azure.
 */

import { DaprClient } from '@dapr/dapr';
import logger from '../core/logger.js';

class DaprSecretManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.daprHost = process.env.DAPR_HOST || '127.0.0.1';
    this.daprPort = process.env.DAPR_HTTP_PORT || '3500';
    this.secretStoreName = 'secretstore';

    this.client = new DaprClient({
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      daprEnabled: true,
      environment: this.environment,
      secretStore: this.secretStoreName,
    });
  }

  /**
   * Get a secret value from Dapr secret store
   * @param {string} secretName - Name of the secret to retrieve
   * @returns {Promise<string>} Secret value
   */
  async getSecret(secretName) {
    try {
      const response = await this.client.secret.get(this.secretStoreName, secretName);

      if (response && typeof response === 'object') {
        const value = response[secretName];
        if (value !== undefined && value !== null) {
          logger.debug('Retrieved secret from Dapr', {
            event: 'secret_retrieved',
            secretName,
            source: 'dapr',
          });
          return String(value);
        }

        const values = Object.values(response);
        if (values.length > 0 && values[0] !== undefined) {
          return String(values[0]);
        }
      }

      throw new Error(`Secret '${secretName}' not found in Dapr store`);
    } catch (error) {
      logger.error(`Failed to get secret from Dapr: ${error.message}`, {
        event: 'secret_retrieval_error',
        secretName,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get JWT configuration from environment variables (preferred) or Dapr secret store (fallback)
   *
   * In Azure: JWT_SECRET is set as env var during deployment (retrieved from Key Vault)
   * Locally with Dapr: JWT_SECRET is retrieved from .dapr/secrets.json
   *
   * @returns {Promise<Object>} JWT configuration parameters
   */
  async getJwtConfig() {
    // Prefer environment variable (set during deployment from Key Vault)
    let secret = process.env.JWT_SECRET;

    // Fallback to Dapr secret store for local development
    if (!secret) {
      try {
        secret = await this.getSecret('JWT_SECRET');
      } catch (error) {
        logger.warn('JWT_SECRET not found in Dapr store');
      }
    }

    if (!secret) {
      throw new Error('JWT_SECRET not found. Set it as env var or in Dapr secret store.');
    }

    return {
      secret,
      algorithm: process.env.JWT_ALGORITHM || 'HS256',
      expiration: parseInt(process.env.JWT_EXPIRATION || '3600', 10),
      issuer: process.env.JWT_ISSUER || 'auth-service',
      audience: process.env.JWT_AUDIENCE || 'xshopai-platform',
    };
  }
}

// Global instance
export const secretManager = new DaprSecretManager();

// Helper functions for easy access
export const getJwtConfig = () => secretManager.getJwtConfig();
