/**
 * Service Resolver — Convention-based service discovery for direct mode.
 *
 * Resolves service URLs without per-service env vars:
 * - Local development: uses a static port registry (localhost:{port})
 * - Azure App Service: uses SERVICE_BASE_URL template (https://app-{name}-xshopai-{suffix}.azurewebsites.net)
 *
 * This module is only used when PLATFORM_MODE=direct.
 * In Dapr mode, the Dapr sidecar handles service discovery natively.
 */

/**
 * Static port registry for local development.
 * Maps service app-id → localhost port.
 */
const PORT_REGISTRY = {
  'product-service': 8001,
  'user-service': 8002,
  'admin-service': 8003,
  'auth-service': 8004,
  'inventory-service': 8005,
  'order-service': 8006,
  'cart-service': 8008,
  'payment-service': 8009,
  'review-service': 8010,
  'notification-service': 8011,
  'audit-service': 8012,
  'chat-service': 8013,
  'web-bff': 8014,
  'order-processor-service': 8007,
};

/**
 * SERVICE_BASE_URL — convention-based URL template for Azure App Service.
 * When set, replaces {name} with the service app-id.
 * When not set (local dev), falls back to localhost:{port}.
 */
const SERVICE_BASE_URL = process.env.SERVICE_BASE_URL || '';

/**
 * Resolve a service URL by app-id.
 *
 * @param {string} appId - The service app-id (e.g. 'user-service')
 * @returns {string} The full base URL for the service
 */
export function resolve(appId) {
  if (SERVICE_BASE_URL) {
    return SERVICE_BASE_URL.replace('{name}', appId);
  }

  const port = PORT_REGISTRY[appId];
  if (port) {
    return `http://localhost:${port}`;
  }

  throw new Error(`[ServiceResolver] Unknown service: '${appId}'. Add it to PORT_REGISTRY or set SERVICE_BASE_URL.`);
}

export default { resolve, PORT_REGISTRY };
