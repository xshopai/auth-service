/**
 * Messaging Abstraction Layer for Auth Service
 * Implements Architecture spec section 5.5
 *
 * Provides a unified interface for event publishing across different
 * messaging providers (Dapr, RabbitMQ, Azure Service Bus).
 *
 * Usage:
 * ```javascript
 * import { getMessagingProvider } from './messaging/index.js';
 *
 * const messaging = getMessagingProvider();
 * await messaging.publishEvent('auth.login.success', eventData, correlationId);
 * ```
 */

export { default as MessagingProvider } from './provider.js';
// Lazy exports - providers loaded on-demand by factory
export { createMessagingProvider, getMessagingProvider, closeMessagingProvider } from './factory.js';
