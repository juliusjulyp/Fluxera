use async_graphql::{Request, Response};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::{ContractAbi, ServiceAbi},
};
use serde::{Deserialize, Serialize};

pub mod state;

/// Operations that can be executed on the Fluxera application
#[derive(Debug, Clone, Serialize, Deserialize, GraphQLMutationRoot)]
pub enum Operation {
    /// Track a new analytics event
    TrackEvent {
        event_type: String,
        data: String,
    },

    /// Send a cross-chain analytics message
    SendCrossChainMessage {
        target_chain: String,
        message_type: String,
        payload: String,
    },

    /// Register a chain in the Fluxera network (Wave 6)
    RegisterChain {
        chain_id: String,
        name: String,
    },
}

/// Cross-chain messages that can be sent between Fluxera instances
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum Message {
    /// Analytics event from another chain
    CrossChainEvent {
        event_type: String,
        data: String,
        source_chain: String,
        timestamp: String,
        /// Original message ID for acknowledgment (Wave 6)
        message_id: Option<String>,
    },

    /// Request for chain metrics
    MetricsRequest {
        requesting_chain: String,
    },

    /// Response with chain metrics
    MetricsResponse {
        total_events: u64,
        unique_users: usize,
    },

    /// Delivery acknowledgment from target chain (Wave 6)
    DeliveryAck {
        /// The message ID being acknowledged
        message_id: String,
        /// When the message was delivered
        delivered_at: String,
        /// The chain that received the message
        receiving_chain: String,
    },

    /// Chain announcement for discovery (Wave 6)
    ChainAnnounce {
        /// The chain announcing itself
        chain_id: String,
        /// Human-readable name
        name: String,
    },
}

/// Events emitted by the application
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FluxeraEvent {
    /// New analytics event tracked
    EventTracked {
        event_id: String,
        event_type: String,
        owner: String,
        timestamp: u64,
    },

    /// Cross-chain message sent
    MessageSent {
        message_id: String,
        target_chain: String,
        message_type: String,
    },

    /// Cross-chain message received
    MessageReceived {
        message_id: String,
        source_chain: String,
        message_type: String,
    },
}

/// Application Binary Interface for Fluxera
pub struct FluxeraAbi;

impl ContractAbi for FluxeraAbi {
    type Operation = Operation;
    type Response = String; // JSON response
}

impl ServiceAbi for FluxeraAbi {
    type Query = Request;
    type QueryResponse = Response;
}
