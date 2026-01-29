import { DaprClient, CommunicationProtocolEnum } from '@dapr/dapr';
import logger from '../core/logger.js';
import { getMessagingProvider } from '../messaging/index.js';

const DAPR_HOST = process.env.DAPR_HOST || 'localhost';
const DAPR_HTTP_PORT = process.env.DAPR_HTTP_PORT || '3500';

// Initialize Dapr client for service invocation
const daprClient = new DaprClient({
  daprHost: DAPR_HOST,
  daprPort: DAPR_HTTP_PORT,
  communicationProtocol: CommunicationProtocolEnum.HTTP,
});

/**
 * Invoke a method on another service via Dapr
 * @param {string} appId - The app ID of the target service
 * @param {string} methodName - The method/endpoint to invoke
 * @param {string} httpMethod - The HTTP method (GET, POST, DELETE, etc.)
 * @param {object} data - The request body (for POST/PUT)
 * @param {object} metadata - Additional metadata (headers, query params)
 * @returns {Promise<object>} - The response from the service
 */
export async function invokeService(appId, methodName, httpMethod = 'GET', data = null, metadata = {}) {
  try {
    logger.debug('Invoking service via Dapr', {
      operation: 'dapr_service_invocation',
      appId,
      methodName,
      httpMethod,
    });

    const response = await daprClient.invoker.invoke(appId, methodName, httpMethod, data, metadata);

    logger.debug('Service invocation successful', {
      operation: 'dapr_service_invocation',
      appId,
      methodName,
      httpMethod,
    });

    return response;
  } catch (error) {
    logger.error('Service invocation failed', {
      operation: 'dapr_service_invocation',
      appId,
      methodName,
      httpMethod,
      error: error.message,
      errorStack: error.stack,
    });
    throw error;
  }
}
/**
 * Publish an event to a topic via messaging provider
 * Uses the messaging abstraction layer for provider flexibility
 * @param {string} topicName - The topic to publish to
 * @param {object} eventData - The event data to publish
 * @returns {Promise<void>}
 */
export async function publishEvent(topicName, eventData) {
  try {
    const event = {
      eventId: generateEventId(),
      eventType: topicName,
      timestamp: new Date().toISOString(),
      source: 'auth-service',
      data: eventData,
      metadata: {
        traceId: eventData.traceId || generateEventId(),
        version: '1.0',
      },
    };

    logger.debug('Publishing event via messaging provider', {
      operation: 'messaging_pubsub',
      topicName,
      eventId: event.eventId,
      traceId: event.metadata.traceId,
    });

    const provider = getMessagingProvider();
    const success = await provider.publishEvent(topicName, event, event.metadata.traceId);

    if (success) {
      logger.info('Event published successfully', {
        operation: 'messaging_pubsub',
        topicName,
        eventId: event.eventId,
        traceId: event.metadata.traceId,
      });
    }
  } catch (error) {
    logger.error('Failed to publish event', {
      operation: 'messaging_pubsub',
      topicName,
      error: error.message,
      errorStack: error.stack,
      traceId: eventData?.traceId,
    });
    // Don't throw - graceful degradation
  }
}

/**
 * Generate a unique event ID
 * @returns {string} - Unique event ID
 */
function generateEventId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export default {
  invokeService,
  publishEvent,
};
