/**
 * LINERA CONFIGURATION
 *
 * Configuration for connecting to Linera local network via @linera/client
 * Defaults to local Docker setup, override with env vars for testnet
 */

export const LINERA_CONFIG = {
  // Faucet URL - local network by default, override with env var for testnet
  FAUCET_URL: process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:8080',

  // Linera service URL for public queries - local by default
  SERVICE_URL: process.env.NEXT_PUBLIC_LINERA_SERVICE || 'http://localhost:8081',

  // Chain ID where Fluxera is deployed (set dynamically by run.bash)
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID || '',

  // Fluxera application ID (set dynamically by run.bash)
  APP_ID: process.env.NEXT_PUBLIC_APP_ID || '',

  // Storage keys for wallet persistence
  STORAGE_KEYS: {
    WALLET: 'fluxera_wallet',
    CHAIN_ID: 'fluxera_chain_id',
    WALLET_TYPE: 'fluxera_wallet_type',
    ADDRESS: 'fluxera_address',
  },

  // Timeouts
  CONNECTION_TIMEOUT: 30000,
  QUERY_TIMEOUT: 10000,
} as const;

/**
 * Event types for analytics tracking
 * These match the event_type field in our Fluxera contract
 */
export const EVENT_TYPES = {
  // User activity
  USER_SIGNUP: 'user_signup',
  PAGE_VIEW: 'page_view',
  BUTTON_CLICK: 'button_click',
  USER_ACTION: 'user_action',

  // Blockchain operations
  TRANSACTION: 'transaction',
  TOKEN_TRANSFER: 'token_transfer',
  SWAP_EXECUTED: 'swap_executed',
  NFT_MINT: 'nft_mint',
  LIQUIDITY_ADD: 'liquidity_add',

  // Cross-chain
  CROSS_CHAIN_SEND: 'cross_chain_send',
  CROSS_CHAIN_RECEIVE: 'cross_chain_receive',

  // System
  API_CALL: 'api_call',
  ERROR: 'error',
} as const;

/**
 * Message types for cross-chain communication
 * These match the Message enum in our Fluxera lib.rs
 */
export const MESSAGE_TYPES = {
  CROSS_CHAIN_EVENT: 'cross_chain_event',
  ANALYTICS_SYNC: 'analytics_sync',
  METRICS_REQUEST: 'metrics_request',
  METRICS_RESPONSE: 'metrics_response',
} as const;

/**
 * Message status for tracking cross-chain message flow
 */
export const MESSAGE_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  EXECUTED: 'executed',
  FAILED: 'failed',
} as const;

// Type exports
export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type MessageStatus = typeof MESSAGE_STATUS[keyof typeof MESSAGE_STATUS];
