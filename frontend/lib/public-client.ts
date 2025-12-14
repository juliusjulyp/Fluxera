/**
 * PUBLIC CLIENT
 *
 * Simple HTTP client for read-only GraphQL queries.
 * Works without wallet connection - anyone can view public blockchain data.
 *
 * Used for:
 * - Dashboard stats (total events, users, messages)
 * - Recent events feed
 * - Chain metrics
 * - Cross-chain message history
 *
 * DEPLOYMENT:
 * Requires `linera service` running. Set NEXT_PUBLIC_LINERA_SERVICE to your service URL.
 * - Local development: http://localhost:8080
 * - Production: Deploy linera service on a server and point to it
 */

import { LINERA_CONFIG } from './linera-config';

// ============================================
// CONFIGURATION
// ============================================

// Store for dynamic chain ID (from connected wallet)
let dynamicChainId: string | null = null;

/**
 * Set the chain ID to query (e.g., from connected wallet)
 */
export function setQueryChainId(chainId: string | null): void {
  dynamicChainId = chainId;
  console.log('[PublicClient] Query chain ID set to:', chainId || '(using default)');
}

/**
 * Get current query chain ID
 */
export function getQueryChainId(): string {
  return dynamicChainId || process.env.NEXT_PUBLIC_CHAIN_ID || '';
}

/**
 * Build the GraphQL endpoint URL for the Fluxera application
 * Uses dynamic chain ID if set, otherwise falls back to env config
 */
function getGraphQLEndpoint(overrideChainId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_LINERA_SERVICE || 'http://localhost:8080';
  const chainId = overrideChainId || dynamicChainId || process.env.NEXT_PUBLIC_CHAIN_ID || '';
  const appId = LINERA_CONFIG.APP_ID;

  if (!chainId || !appId) {
    console.warn('[PublicClient] Missing CHAIN_ID or APP_ID configuration');
  }

  return `${baseUrl}/chains/${chainId}/applications/${appId}`;
}

/**
 * Get the endpoint URL (for display purposes)
 */
export function getServiceEndpoint(): string {
  return process.env.NEXT_PUBLIC_LINERA_SERVICE || 'http://localhost:8080';
}

// ============================================
// QUERY FUNCTION
// ============================================

export interface GraphQLResponse<T = unknown> {
  data: T | null;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a public GraphQL query against the Fluxera application
 *
 * @param query - GraphQL query string
 * @param variables - Optional query variables
 * @returns Query result
 */
export async function publicQuery<T = unknown>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const endpoint = getGraphQLEndpoint();

  console.log('[PublicClient] Querying:', endpoint);
  console.log('[PublicClient] Query:', query.trim().substring(0, 100) + '...');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    console.log('[PublicClient] Response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('[PublicClient] HTTP error response:', text);
      throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
    }

    const result: GraphQLResponse<T> = await response.json();
    console.log('[PublicClient] Result:', result);

    if (result.errors && result.errors.length > 0) {
      console.error('[PublicClient] GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }

    if (!result.data) {
      console.warn('[PublicClient] No data in response');
      throw new Error('No data returned from query');
    }

    return result.data;
  } catch (error) {
    console.error('[PublicClient] Query failed:', error);
    throw error;
  }
}

// ============================================
// PRE-BUILT QUERIES
// ============================================

/**
 * Fetch analytics summary (total events, messages, users)
 */
export async function fetchAnalyticsSummary() {
  return publicQuery<{
    analyticsSummary: {
      totalEvents: number;
      totalMessages: number;
      uniqueUsers: number;
      chainId: string;
    };
  }>(`
    query {
      analyticsSummary {
        totalEvents
        totalMessages
        uniqueUsers
        chainId
      }
    }
  `);
}

/**
 * Fetch recent events
 */
export async function fetchRecentEvents(limit: number = 10) {
  return publicQuery<{
    recentEvents: Array<{
      eventId: string;
      eventType: string;
      owner: string;
      timestamp: string;
      data: string;
      chainId: string;
    }>;
  }>(`
    query {
      recentEvents(limit: ${limit}) {
        eventId
        eventType
        owner
        timestamp
        data
        chainId
      }
    }
  `);
}

/**
 * Fetch paginated events
 */
export async function fetchEvents(offset: number = 0, limit: number = 20) {
  return publicQuery<{
    events: Array<{
      eventId: string;
      eventType: string;
      owner: string;
      timestamp: string;
      data: string;
      chainId: string;
    }>;
  }>(`
    query {
      events(offset: ${offset}, limit: ${limit}) {
        eventId
        eventType
        owner
        timestamp
        data
        chainId
      }
    }
  `);
}

/**
 * Fetch recent cross-chain messages
 */
export async function fetchRecentMessages(limit: number = 10) {
  return publicQuery<{
    recentMessages: Array<{
      messageId: string;
      sourceChain: string;
      targetChain: string;
      messageType: string;
      sentAt: string;
      payload: string;
    }>;
  }>(`
    query {
      recentMessages(limit: ${limit}) {
        messageId
        sourceChain
        targetChain
        messageType
        sentAt
        payload
      }
    }
  `);
}

/**
 * Fetch all chain metrics
 */
export async function fetchAllChainMetrics() {
  return publicQuery<{
    allChainMetrics: Array<{
      chainId: string;
      metrics: {
        totalEvents: number;
        uniqueUsers: number;
        lastActivity: string;
        eventTypes: string;
      };
    }>;
  }>(`
    query {
      allChainMetrics {
        chainId
        metrics {
          totalEvents
          uniqueUsers
          lastActivity
          eventTypes
        }
      }
    }
  `);
}

/**
 * Fetch complete dashboard data in one query
 */
export async function fetchDashboardData(eventsLimit: number = 10, messagesLimit: number = 5) {
  return publicQuery<{
    analyticsSummary: {
      totalEvents: number;
      totalMessages: number;
      uniqueUsers: number;
      chainId: string;
    };
    recentEvents: Array<{
      eventId: string;
      eventType: string;
      owner: string;
      timestamp: string;
      data: string;
      chainId: string;
    }>;
    recentMessages: Array<{
      messageId: string;
      sourceChain: string;
      targetChain: string;
      messageType: string;
      sentAt: string;
      payload: string;
    }>;
    allChainMetrics: Array<{
      chainId: string;
      metrics: {
        totalEvents: number;
        uniqueUsers: number;
        lastActivity: string;
        eventTypes: string;
      };
    }>;
  }>(`
    query {
      analyticsSummary {
        totalEvents
        totalMessages
        uniqueUsers
        chainId
      }
      recentEvents(limit: ${eventsLimit}) {
        eventId
        eventType
        owner
        timestamp
        data
        chainId
      }
      recentMessages(limit: ${messagesLimit}) {
        messageId
        sourceChain
        targetChain
        messageType
        sentAt
        payload
      }
      allChainMetrics {
        chainId
        metrics {
          totalEvents
          uniqueUsers
          lastActivity
          eventTypes
        }
      }
    }
  `);
}
