/**
 * Service Resolver — Service discovery for direct mode.
 *
 * Resolution order:
 *   1. Azure App Service: SERVICE_BASE_URL template (when set)
 *   2. Consul: query the service catalog via HTTP API (when CONSUL_URL is set)
 *   3. Convention fallback: static PORT_REGISTRY (localhost:{port})
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

const SERVICE_BASE_URL = process.env.SERVICE_BASE_URL || '';
const CONSUL_URL = process.env.CONSUL_URL || '';

/** In-memory cache for Consul lookups (TTL-based). */
const consulCache = new Map();
const CACHE_TTL_MS = 30_000;

/**
 * Query Consul for a healthy service instance.
 * @param {string} appId
 * @returns {Promise<string|null>}
 */
async function queryConsul(appId) {
  if (!CONSUL_URL) return null;

  const cached = consulCache.get(appId);
  if (cached && Date.now() < cached.expiresAt) return cached.url;

  try {
    const res = await fetch(`${CONSUL_URL}/v1/health/service/${appId}?passing=true`);
    if (!res.ok) return null;

    const entries = await res.json();
    if (!entries || entries.length === 0) return null;

    const svc = entries[0].Service;
    const address = svc.Address || 'localhost';
    const url = `http://${address}:${svc.Port}`;

    consulCache.set(appId, { url, expiresAt: Date.now() + CACHE_TTL_MS });
    return url;
  } catch {
    return null;
  }
}

/**
 * Resolve a service URL (async — queries Consul when available).
 * @param {string} appId
 * @returns {Promise<string>}
 */
export async function resolveAsync(appId) {
  if (SERVICE_BASE_URL) return SERVICE_BASE_URL.replace('{name}', appId);

  const consulUrl = await queryConsul(appId);
  if (consulUrl) return consulUrl;

  const port = PORT_REGISTRY[appId];
  if (port) return `http://localhost:${port}`;

  throw new Error(`[ServiceResolver] Unknown service: '${appId}'. Add it to PORT_REGISTRY or set SERVICE_BASE_URL.`);
}

/**
 * Resolve a service URL (sync — convention-based only, reads Consul cache).
 * @param {string} appId
 * @returns {string}
 */
export function resolve(appId) {
  if (SERVICE_BASE_URL) return SERVICE_BASE_URL.replace('{name}', appId);

  const cached = consulCache.get(appId);
  if (cached && Date.now() < cached.expiresAt) return cached.url;

  const port = PORT_REGISTRY[appId];
  if (port) return `http://localhost:${port}`;

  throw new Error(`[ServiceResolver] Unknown service: '${appId}'. Add it to PORT_REGISTRY or set SERVICE_BASE_URL.`);
}

export default { resolve, resolveAsync, PORT_REGISTRY };
