/**
 * LINERA PUBLIC CLIENT
 *
 * Uses @linera/client to query the Fluxera application directly via validators.
 * NO linera service required - works from any browser, anywhere.
 *
 * This client:
 * 1. Connects to the faucet to get validator configuration
 * 2. Creates a read-only wallet (no chain ownership needed for queries)
 * 3. Queries the application via the Linera protocol (gRPC)
 *
 * For mutations (trackEvent, sendMessage), users still need to connect
 * their own wallet via LineraProvider.
 */

import { LINERA_CONFIG } from './linera-config';

// ============================================
// STATE
// ============================================

let clientInstance: any = null;
let backendInstance: any = null;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the public Linera client
 * This connects to validators via the faucet and sets up a read-only client
 */
async function initializeClient(): Promise<void> {
  if (clientInstance && backendInstance) {
    return; // Already initialized
  }

  console.log('[LineraPublicClient] Initializing...');

  try {
    // Load @linera/client WASM module
    const { loadLineraClient } = await import('./linera-loader');
    const linera = await loadLineraClient();

    const Faucet = linera.Faucet;
    const Client = linera.Client;

    if (!Faucet || !Client) {
      throw new Error('Linera client classes not found in module');
    }

    // Connect to faucet to get validator configuration
    console.log('[LineraPublicClient] Connecting to faucet:', LINERA_CONFIG.FAUCET_URL);
    const faucet = new Faucet(LINERA_CONFIG.FAUCET_URL);

    // Create a wallet (gets genesis config with validator endpoints)
    // We don't need to claim a chain for read-only queries
    console.log('[LineraPublicClient] Creating read-only wallet...');
    const wallet = await faucet.createWallet();

    // Create client without a signer (read-only mode)
    console.log('[LineraPublicClient] Creating client...');
    const client = await new Client(wallet, null, true); // skip_process_inbox=true for read-only
    clientInstance = client;

    // Connect to the Fluxera application
    // The correct API is client.frontend().application(appId)
    if (LINERA_CONFIG.APP_ID) {
      console.log('[LineraPublicClient] Connecting to app:', LINERA_CONFIG.APP_ID);

      // Try the correct frontend().application() API first
      if (client?.frontend) {
        const frontend = client.frontend();
        if (frontend?.application) {
          const backend = await frontend.application(LINERA_CONFIG.APP_ID);
          backendInstance = backend;
          console.log('[LineraPublicClient] Ready via frontend().application()!');
        } else {
          throw new Error('frontend.application() not available');
        }
      }
      // Fallback to direct client.application() if frontend() doesn't exist
      else if (client?.application) {
        const backend = await client.application(LINERA_CONFIG.APP_ID);
        backendInstance = backend;
        console.log('[LineraPublicClient] Ready via client.application()!');
      } else {
        throw new Error('No application() method available on client');
      }
    } else {
      throw new Error('APP_ID not configured');
    }

  } catch (error) {
    console.error('[LineraPublicClient] Initialization failed:', error);
    initError = error instanceof Error ? error : new Error('Initialization failed');
    throw initError;
  }
}

/**
 * Ensure client is initialized (singleton pattern)
 */
async function ensureInitialized(): Promise<void> {
  if (initError) {
    // Reset and retry if previous init failed
    initPromise = null;
    initError = null;
  }

  if (!initPromise) {
    initPromise = initializeClient();
  }

  await initPromise;
}

// ============================================
// QUERY FUNCTION
// ============================================

export interface GraphQLResponse<T = unknown> {
  data: T | null;
  errors?: Array<{ message: string }>;
}

/**
 * Execute a GraphQL query against the Fluxera application
 * Uses @linera/client to communicate directly with validators
 *
 * @param query - GraphQL query string
 * @returns Query result
 */
export async function lineraQuery<T = unknown>(query: string): Promise<T> {
  await ensureInitialized();

  if (!backendInstance) {
    throw new Error('Backend not initialized');
  }

  console.log('[LineraPublicClient] Querying:', query.trim().substring(0, 100) + '...');

  try {
    // The backend.query() method accepts a JSON string in Apollo format
    const payload = JSON.stringify({ query });
    const responseStr = await backendInstance.query(payload);
    const response: GraphQLResponse<T> = JSON.parse(responseStr);

    console.log('[LineraPublicClient] Response:', response);

    if (response.errors && response.errors.length > 0) {
      throw new Error(response.errors[0].message);
    }

    if (!response.data) {
      throw new Error('No data returned from query');
    }

    return response.data;

  } catch (error) {
    console.error('[LineraPublicClient] Query failed:', error);
    throw error;
  }
}

/**
 * Check if the public client is initialized
 */
export function isClientReady(): boolean {
  return clientInstance !== null && backendInstance !== null;
}

/**
 * Get initialization error if any
 */
export function getInitError(): Error | null {
  return initError;
}

/**
 * Reset the client (useful for retry logic)
 */
export function resetClient(): void {
  clientInstance = null;
  backendInstance = null;
  initPromise = null;
  initError = null;
}

// ============================================
// PRE-BUILT QUERIES
// ============================================

/**
 * Fetch analytics summary (total events, messages, users)
 */
export async function fetchAnalyticsSummary() {
  return lineraQuery<{
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
  return lineraQuery<{
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
  return lineraQuery<{
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
  return lineraQuery<{
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
  return lineraQuery<{
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
  return lineraQuery<{
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
