/**
 * Dapr Secret Management Service
 * Provides secret management using Dapr's secret store building block.
 *
 * Secret Naming Convention:
 *   Local (.dapr/secrets.json): UPPER_SNAKE_CASE (e.g., JWT_SECRET)
   Azure Key Vault: lower-kebab-case (e.g., jwt-secret)
 *   The mapping is handled by Dapr component configuration in Azure.
 */

import logger from '../core/logger.js';

// Check messaging provider before loading anything
const messagingProvider = (process.env.MESSAGING_PROVIDER || 'dapr').toLowerCase();

class DaprSecretManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'development';
    this.daprHost = process.env.DAPR_HOST || '127.0.0.1';
    this.daprPort = process.env.DAPR_HTTP_PORT || '3500';
    this.secretStoreName = 'secretstore';
    this.messagingProvider = messagingProvider;

    // Skip Dapr client if using direct messaging (RabbitMQ/ServiceBus)
    if (this.messagingProvider !== 'dapr') {
      logger.info('Secret manager initialized (Dapr skipped)', {
        event: 'secret_manager_init',
        daprEnabled: false,
        messagingProvider: this.messagingProvider,
        environment: this.environment,
      });
      this.client = null;
      return;
    }

    // Only import and initialize DaprClient when using Dapr
    this._initDaprClient();

    logger.info('Secret manager initialized', {
      event: 'secret_manager_init',
      daprEnabled: true,
      environment: this.environment,
      secretStore: this.secretStoreName,
    });
  }

  async _initDaprClient() {
    // Dynamic import only when messaging provider is Dapr
    const { DaprClient } = await import('@dapr/dapr');
    this.client = new DaprClient({
      daprHost: this.daprHost,
      daprPort: this.daprPort,
    });
  }

  /**
   * Get a secret value from Dapr secret store
   * @param {string} secretName - Name of the secret to retrieve
   * @returns {Promise<string>} Secret value
   */
  async getSecret(secretName) {
    // If Dapr client is not initialized (using direct messaging), throw to trigger fallback
    if (!this.client) {
      throw new Error(`Dapr client not available (using ${this.messagingProvider})`);
    }

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
   * Get JWT configuration from Dapr secret store (preferred) or environment variables (fallback)
   *
   * Priority Order:
   * 1. Dapr Secret Store (.dapr/secrets.json) - when running with Dapr
   * 2. Environment Variable (.env file) - when running without Dapr
   *
   * @returns {Promise<Object>} JWT configuration parameters
   */
  async getJwtConfig() {
    let secret = null;

    // Priority 1: Try Dapr secret store first
    try {
      secret = await this.getSecret('JWT_SECRET');
      logger.debug('JWT_SECRET retrieved from Dapr secret store');
    } catch (error) {
      logger.debug('JWT_SECRET not found in Dapr secret store, trying ENV variable');

      // Priority 2: Fallback to environment variable (from .env file)
      secret = process.env.JWT_SECRET;
    }

    if (!secret) {
      throw new Error('JWT_SECRET not found. Configure it in Dapr secret store or .env file.');
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
