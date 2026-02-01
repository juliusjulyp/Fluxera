/**
 * TYPESCRIPT TYPES FOR FLUXERA
 *
 * These types define the shape of data we get from the Fluxera GraphQL API
 * They mirror the Rust structs defined in state.rs
 *
 * WHY WE NEED TYPES:
 * - Type Safety: Catch errors at compile time
 * - Autocomplete: Editor suggestions for available fields
 * - Documentation: Types show what data looks like
 * - Refactoring: Easier to update when data structure changes
 *
 * MAPPING TO RUST CODE:
 * TypeScript Type → Rust Struct (in state.rs)
 * - AnalyticsEvent → pub struct AnalyticsEvent (line 14-21)
 * - ChainMetrics → pub struct ChainMetrics (line 24-30)
 * - CrossChainMessage → pub struct CrossChainMessage (line 33-40)
 * - FluxeraState → pub struct FluxeraState (line 43-51)
 */

/**
 * ANALYTICS EVENT
 *
 * Represents a single tracked event on the blockchain
 *
 * RUST DEFINITION (state.rs line 14-21):
 * #[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
 * pub struct AnalyticsEvent {
 *   pub event_id: String,     // Unique ID like "chain_id-123"
 *   pub event_type: String,   // Blockchain event type (see BLOCKCHAIN EVENT TYPES below)
 *   pub owner: String,        // User who triggered it
 *   pub timestamp: String,    // When it happened
 *   pub data: String,         // JSON with custom data
 *   pub chain_id: String,     // Which chain it's from
 * }
 *
 * BLOCKCHAIN EVENT TYPES:
 * Token Operations:
 *   - token_transfer: Token transferred between accounts
 *   - token_mint: New tokens created
 *   - token_burn: Tokens destroyed
 *
 * DeFi Operations:
 *   - swap_executed: Token swap in AMM
 *   - liquidity_added: Liquidity provided to pool
 *   - liquidity_removed: Liquidity withdrawn from pool
 *   - order_placed: Order placed in matching engine
 *
 * NFT Operations:
 *   - nft_mint: NFT created
 *   - nft_transfer: NFT ownership transferred
 *   - nft_burn: NFT destroyed
 *
 * Cross-Chain Operations:
 *   - cross_chain_transfer: Cross-chain token transfer
 *   - cross_chain_message: Message sent between chains
 *   - chain_subscription: Subscribed to another chain's events
 *
 * Application Operations:
 *   - application_deployed: New application deployed
 *   - contract_call: Smart contract function called
 *
 * EXAMPLE DATA (Blockchain-native events):
 * {
 *   eventId: "04022f7a...-0",
 *   eventType: "token_transfer",
 *   owner: "0x30a989af...",
 *   timestamp: "2025-11-29 07:43:39.273921",
 *   data: "{\"from\":\"0xabc...\",\"to\":\"0xdef...\",\"amount\":\"100\",\"token\":\"LINERA\"}",
 *   chainId: "04022f7a..."
 * }
 */
export interface AnalyticsEvent {
  eventId: string;
  eventType: string;
  owner: string;
  timestamp: string;
  data: string; // JSON string - parse with JSON.parse()
  chainId: string;
}

/**
 * CHAIN METRICS
 *
 * Aggregated statistics for a specific microchain
 *
 * RUST DEFINITION (state.rs line 24-30):
 * pub struct ChainMetrics {
 *   pub total_events: u64,      // Count of events on this chain
 *   pub unique_users: u64,      // Number of distinct users
 *   pub last_activity: String,  // Timestamp of latest event
 *   pub event_types: String,    // JSON object with counts per type
 * }
 *
 * EXAMPLE DATA (Blockchain-native event types):
 * {
 *   totalEvents: 3,
 *   uniqueUsers: 1,
 *   lastActivity: "2025-11-29 07:44:40.977878",
 *   eventTypes: "{\"token_transfer\":5,\"swap_executed\":2,\"nft_mint\":1}"
 * }
 *
 * NOTE: eventTypes is a JSON string, parse it to get object:
 * const types = JSON.parse(metrics.eventTypes);
 * // { "token_transfer": 5, "swap_executed": 2, "nft_mint": 1 }
 */
export interface ChainMetrics {
  totalEvents: number;
  uniqueUsers: number;
  lastActivity: string;
  eventTypes: string; // JSON string - parse to get { [eventType: string]: number }
}

/**
 * CHAIN METRICS WITH ID
 *
 * Chain metrics with the chain ID included
 * Used when fetching metrics for multiple chains
 *
 * RUST DEFINITION (service.rs line 233-237):
 * struct ChainMetricsWithId {
 *   chain_id: String,
 *   metrics: ChainMetrics,
 * }
 */
export interface ChainMetricsWithId {
  chainId: string;
  metrics: ChainMetrics;
}

/**
 * CROSS-CHAIN MESSAGE
 *
 * Represents a message sent from one chain to another
 *
 * RUST DEFINITION (state.rs line 33-40):
 * pub struct CrossChainMessage {
 *   pub message_id: String,     // Unique ID like "chain-msg-5"
 *   pub source_chain: String,   // Chain that sent it
 *   pub target_chain: String,   // Chain that receives it
 *   pub message_type: String,   // Type like "analytics_sync"
 *   pub sent_at: String,        // When it was sent
 *   pub payload: String,        // JSON data being sent
 * }
 *
 * EXAMPLE DATA:
 * {
 *   messageId: "chain_001-msg-5",
 *   sourceChain: "chain_001",
 *   targetChain: "chain_002",
 *   messageType: "analytics_sync",
 *   sentAt: "2025-11-29 10:30:00",
 *   payload: "{\"events\":[...]}"
 * }
 */
export interface CrossChainMessage {
  messageId: string;
  sourceChain: string;
  targetChain: string;
  messageType: string;
  sentAt: string;
  payload: string; // JSON string
}

// === Wave 6: Multi-Chain Support Types ===

/**
 * MESSAGE STATUS
 *
 * Delivery status for cross-chain messages (Wave 6)
 *
 * RUST DEFINITION (state.rs):
 * pub enum MessageStatus {
 *   Sent,
 *   Delivered,
 *   Failed,
 * }
 *
 * NOTE: GraphQL returns UPPERCASE (SENT, DELIVERED, FAILED)
 * Use normalizeMessageStatus() to convert to display format
 */
export type MessageStatus = 'Sent' | 'Delivered' | 'Failed' | 'SENT' | 'DELIVERED' | 'FAILED';

/**
 * Normalize message status from API (uppercase) to display format (capitalized)
 */
export function normalizeMessageStatus(status: string | undefined | null): 'Sent' | 'Delivered' | 'Failed' {
  if (!status) return 'Sent';
  const upper = status.toUpperCase();
  if (upper === 'DELIVERED') return 'Delivered';
  if (upper === 'FAILED') return 'Failed';
  return 'Sent';
}

/**
 * ENHANCED CROSS-CHAIN MESSAGE (V2)
 *
 * Cross-chain message with status tracking (Wave 6)
 *
 * RUST DEFINITION (state.rs):
 * pub struct CrossChainMessageV2 {
 *   pub message_id: String,
 *   pub source_chain: String,
 *   pub target_chain: String,
 *   pub message_type: String,
 *   pub sent_at: String,
 *   pub payload: String,
 *   pub status: MessageStatus,
 *   pub delivered_at: Option<String>,
 * }
 */
export interface CrossChainMessageV2 {
  messageId: string;
  sourceChain: string;
  targetChain: string;
  messageType: string;
  sentAt: string;
  payload: string;
  status: MessageStatus;
  deliveredAt?: string | null;
}

/**
 * REGISTERED CHAIN
 *
 * Information about a known Fluxera chain (Wave 6)
 *
 * RUST DEFINITION (state.rs):
 * pub struct RegisteredChain {
 *   pub chain_id: String,
 *   pub name: String,
 *   pub registered_at: String,
 *   pub last_activity: Option<String>,
 *   pub messages_sent: u64,
 *   pub messages_received: u64,
 * }
 */
export interface RegisteredChain {
  chainId: string;
  name: string;
  registeredAt: string;
  lastActivity?: string | null;
  messagesSent: number;
  messagesReceived: number;
}

/**
 * ANALYTICS SUMMARY
 *
 * High-level statistics about the entire analytics system
 *
 * RUST DEFINITION (service.rs line 240-246):
 * struct AnalyticsSummary {
 *   total_events: u64,
 *   total_messages: u64,
 *   unique_users: usize,
 *   chain_id: String,
 * }
 *
 * EXAMPLE DATA:
 * {
 *   totalEvents: 1250,
 *   totalMessages: 42,
 *   uniqueUsers: 150,
 *   chainId: "04022f7a..."
 * }
 */
export interface AnalyticsSummary {
  totalEvents: number;
  totalMessages: number;
  uniqueUsers: number;
  chainId: string;
}

/**
 * PARSED EVENT DATA
 *
 * Helper type for when you parse the 'data' field of an AnalyticsEvent
 * This is NOT from Rust - it's a frontend convenience type
 *
 * USAGE:
 * const event: AnalyticsEvent = {...};
 * const parsedData = JSON.parse(event.data) as ParsedEventData;
 * console.log(parsedData.email); // Type-safe access!
 */
export interface ParsedEventData {
  [key: string]: any; // Can contain any JSON data
}

/**
 * PARSED EVENT TYPES
 *
 * Helper type for when you parse the 'eventTypes' field of ChainMetrics
 *
 * USAGE:
 * const metrics: ChainMetrics = {...};
 * const types = JSON.parse(metrics.eventTypes) as ParsedEventTypes;
 * console.log(types["page_view"]); // Number of page view events
 */
export interface ParsedEventTypes {
  [eventType: string]: number;
}

/**
 * MUTATION RESPONSE
 *
 * The response from trackEvent or sendCrossChainMessage mutations
 * These mutations return JSON strings that need to be parsed
 *
 * FROM contract.rs:
 * return json!({ "success": true, "event_id": event_id, "timestamp": timestamp }).to_string();
 *
 * USAGE:
 * const result = await trackEvent({ variables: {...} });
 * const response = JSON.parse(result.data.trackEvent) as MutationResponse;
 * if (response.success) {
 *   console.log("Event ID:", response.event_id);
 * }
 */
export interface TrackEventResponse {
  success: boolean;
  event_id: string;
  timestamp: string;
}

export interface SendMessageResponse {
  success: boolean;
  message_id: string;
  timestamp: string;
}

/**
 * GRAPHQL QUERY RESPONSE TYPES
 *
 * These types define the shape of data returned from GraphQL queries
 * They wrap the actual data in a structure that Apollo Client uses
 */

export interface GetAnalyticsSummaryResponse {
  analyticsSummary: AnalyticsSummary;
}

export interface GetRecentEventsResponse {
  recentEvents: AnalyticsEvent[];
}

export interface GetEventsResponse {
  events: AnalyticsEvent[];
}

export interface GetEventsByTypeResponse {
  eventsByType: AnalyticsEvent[];
}

export interface GetEventsByOwnerResponse {
  eventsByOwner: AnalyticsEvent[];
}

export interface GetChainMetricsResponse {
  chainMetrics: ChainMetrics | null;
}

export interface GetAllChainMetricsResponse {
  allChainMetrics: ChainMetricsWithId[];
}

export interface GetUserEventCountResponse {
  userEventCount: number;
}

export interface GetRecentMessagesResponse {
  recentMessages: CrossChainMessage[];
}

export interface GetMessagesResponse {
  messages: CrossChainMessage[];
}

/**
 * COMPLETE DASHBOARD DATA
 *
 * Response type for the GET_DASHBOARD_DATA query
 * This includes everything needed for the dashboard in one query
 */
export interface GetDashboardDataResponse {
  analyticsSummary: AnalyticsSummary;
  recentEvents: AnalyticsEvent[];
  recentMessages: CrossChainMessage[];
  allChainMetrics: ChainMetricsWithId[];
}

/**
 * EVENT FORM DATA
 *
 * Type for the event tracking form
 * This is what the user inputs
 */
export interface EventFormData {
  eventType: string;
  data: Record<string, any>; // Object that will be JSON.stringify'd
}

/**
 * MESSAGE FORM DATA
 *
 * Type for the cross-chain message form
 */
export interface MessageFormData {
  targetChain: string;
  messageType: string;
  payload: Record<string, any>; // Object that will be JSON.stringify'd
}

// === Wave 6: Additional Response Types ===

export interface GetMessageStatusResponse {
  messageStatus: CrossChainMessageV2 | null;
}

export interface GetMessagesWithStatusResponse {
  messagesWithStatus: CrossChainMessageV2[];
}

export interface GetPendingMessagesResponse {
  pendingMessages: CrossChainMessageV2[];
}

export interface GetMessagesByStatusResponse {
  messagesByStatus: CrossChainMessageV2[];
}

export interface GetRegisteredChainsResponse {
  registeredChains: RegisteredChain[];
}

export interface GetRegisteredChainResponse {
  registeredChain: RegisteredChain | null;
}
