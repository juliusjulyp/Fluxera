use async_graphql::SimpleObject;
use linera_sdk::views::{
    linera_views, LogView, MapView, RegisterView, RootView, ViewStorageContext,
};
use serde::{Deserialize, Serialize};

/// An analytics event tracked on-chain
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct AnalyticsEvent {
    /// Unique event ID
    pub event_id: String,
    /// Type of event (e.g., "transfer", "interaction", "message")
    pub event_type: String,
    /// User/owner who triggered the event
    pub owner: String,
    /// Timestamp
    pub timestamp: String,  // Store as string for GraphQL compatibility
    /// Event-specific data as JSON
    pub data: String,
    /// Chain ID where event occurred
    pub chain_id: String,
}

/// Chain-level analytics metrics
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct ChainMetrics {
    /// Total number of events on this chain
    pub total_events: u64,
    /// Number of unique users
    pub unique_users: u64,
    /// Timestamp of last activity
    pub last_activity: String,
    /// Events by type
    pub event_types: String,
}

/// Cross-chain message record
#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct CrossChainMessage {
    /// Message ID
    pub message_id: String,
    /// Source chain ID
    pub source_chain: String,
    /// Target chain ID
    pub target_chain: String,
    /// Message type
    pub message_type: String,
    /// Timestamp when sent
    pub sent_at: String,
    /// Message payload
    pub payload: String,
}

/// The application state
#[derive(RootView)]
#[view(context = ViewStorageContext)]
pub struct FluxeraState {
    /// Total event count across all chains
    pub total_event_count: RegisterView<u64>,

    /// Log of all analytics events (append-only)
    pub events: LogView<AnalyticsEvent>,

    /// Map of chain_id -> chain metrics
    pub chain_metrics: MapView<String, ChainMetrics>,

    /// Map of owner -> event count
    pub user_event_counts: MapView<String, u64>,

    /// Log of cross-chain messages
    pub cross_chain_messages: LogView<CrossChainMessage>,

    /// Total cross-chain messages sent
    pub total_messages: RegisterView<u64>,
}
