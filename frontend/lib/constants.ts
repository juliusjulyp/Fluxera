// Fluxera Application Constants
// This file centralizes all configuration for connecting to the Fluxera WebAssembly application

/**
 * WHAT THIS DOES:
 * - Stores the Chain ID and App ID from our deployed Fluxera application
 * - Builds the GraphQL endpoint URL dynamically
 * - Uses environment variables so we can switch between local/testnet/production
 *
 * HOW IT WORKS:
 * - In development: Reads from .env.local (localhost:8080)
 * - In production: Will read from .env.production (testnet endpoint)
 */

export const FLUXERA_CONFIG = {
  // Application ID - This is the unique identifier for our deployed Fluxera WASM app
  // Deployed on Conway Testnet: 2025-11-30
  APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'd249067da421cbe05fa254ed0c9755dfeb744fd850695990a78d73d598cc8d2d',

  // Chain ID - The Linera microchain where our app is deployed
  // Conway Testnet chain from faucet
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '935947af6cdb0956bd3f58a12a69dbeb14eec700d086e6eaa6faf2ab31d4ea64',

  // Base GraphQL endpoint for the Linera service
  // Local: http://localhost:8080 (from 'linera service')
  // Testnet: Will be https://conway.linera.io or similar
  GRAPHQL_ENDPOINT: process.env.NEXT_PUBLIC_GRAPHQL_ENDPOINT || 'http://localhost:8080',

  // Full application GraphQL URL
  // Format: {endpoint}/chains/{chainId}/applications/{appId}
  // This is where we send all our GraphQL queries
  get APP_GRAPHQL_URL() {
    return `${this.GRAPHQL_ENDPOINT}/chains/${this.CHAIN_ID}/applications/${this.APP_ID}`;
  },
} as const;

/**
 * EVENT TYPES
 * These match the event types we defined in our Fluxera contract
 * Users can track these different types of analytics events
 */
export const EVENT_TYPES = {
  USER_SIGNUP: 'user_signup',      // When a user registers
  PAGE_VIEW: 'page_view',          // Page navigation tracking
  BUTTON_CLICK: 'button_click',    // UI interaction tracking
  USER_ACTION: 'user_action',      // Generic user actions
  TRANSACTION: 'transaction',      // Blockchain transactions
  API_CALL: 'api_call',           // External API calls
} as const;

/**
 * MESSAGE TYPES
 * These are used for cross-chain communication
 * They match the Message enum in our Fluxera lib.rs
 */
export const MESSAGE_TYPES = {
  CROSS_CHAIN_EVENT: 'cross_chain_event',  // Event sent to another chain
  ANALYTICS_SYNC: 'analytics_sync',        // Sync analytics data
  METRICS_REQUEST: 'metrics_request',      // Request metrics from another chain
  METRICS_RESPONSE: 'metrics_response',    // Response with metrics
} as const;

/**
 * POLLING INTERVALS
 * How often we refresh data from the blockchain
 * Measured in milliseconds
 */
export const POLLING_INTERVALS = {
  STATS: 5000,      // Refresh stats every 5 seconds
  EVENTS: 3000,     // Refresh events every 3 seconds
  MESSAGES: 10000,  // Refresh messages every 10 seconds
} as const;
