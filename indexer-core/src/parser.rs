use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::listener::{FluxeraEvent, FluxeraMessage};

/// Normalized event structure for our database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NormalizedEvent {
    pub id: String,
    pub event_type: EventType,
    pub block_height: u64,
    pub microchain_id: String,
    pub timestamp: u64,
    pub transaction_data: Option<TransactionData>,
    pub contract_event_data: Option<ContractEventData>,
    pub state_change_data: Option<StateChangeData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum EventType {
    Transaction,
    ContractEvent,
    StateChange,
    BlockFinalized,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionData {
    pub transaction_id: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: u64,
    pub gas_used: u64,
    pub status: TransactionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum TransactionStatus {
    Pending,
    Success,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContractEventData {
    pub contract_address: String,
    pub event_name: String,
    pub event_data: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StateChangeData {
    pub account_id: String,
    pub previous_state: serde_json::Value,
    pub new_state: serde_json::Value,
}

/// Parses and normalizes raw Linera events into our standard format
pub struct EventParser {
    // Configuration for parsing rules
}

impl EventParser {
    pub fn new() -> Self {
        Self {}
    }

    /// Parse a Fluxera analytics event into normalized format
    pub fn parse_fluxera_event(&self, event: &FluxeraEvent) -> Result<NormalizedEvent> {
        // Parse timestamp - try to parse as number first, then as string
        let timestamp = event.timestamp.parse::<u64>().unwrap_or_else(|_| {
            // Try parsing as ISO date string
            chrono::DateTime::parse_from_rfc3339(&event.timestamp)
                .map(|dt| dt.timestamp_millis() as u64)
                .unwrap_or(0)
        });

        let event_type = match event.event_type.as_str() {
            "transfer" | "transaction" => EventType::Transaction,
            "interaction" | "contract_call" => EventType::ContractEvent,
            "state_change" => EventType::StateChange,
            _ => EventType::ContractEvent, // Default to contract event for custom types
        };

        // Parse event data as JSON if possible
        let event_data: serde_json::Value = serde_json::from_str(&event.data)
            .unwrap_or_else(|_| serde_json::json!({ "raw": event.data }));

        Ok(NormalizedEvent {
            id: event.event_id.clone(),
            event_type,
            block_height: 0, // Not available in Fluxera events
            microchain_id: event.chain_id.clone(),
            timestamp,
            transaction_data: None,
            contract_event_data: Some(ContractEventData {
                contract_address: event.chain_id.clone(),
                event_name: event.event_type.clone(),
                event_data,
            }),
            state_change_data: None,
        })
    }

    /// Parse a Fluxera cross-chain message into normalized format
    pub fn parse_fluxera_message(&self, message: &FluxeraMessage) -> Result<NormalizedEvent> {
        // Parse timestamp
        let timestamp = message.sent_at.parse::<u64>().unwrap_or_else(|_| {
            chrono::DateTime::parse_from_rfc3339(&message.sent_at)
                .map(|dt| dt.timestamp_millis() as u64)
                .unwrap_or(0)
        });

        // Create message data as JSON
        let message_data = serde_json::json!({
            "message_id": message.message_id,
            "source_chain": message.source_chain,
            "target_chain": message.target_chain,
            "message_type": message.message_type,
            "payload": message.payload,
            "status": message.status,
            "delivered_at": message.delivered_at,
        });

        Ok(NormalizedEvent {
            id: format!("msg_{}", message.message_id),
            event_type: EventType::StateChange, // Cross-chain messages are state changes
            block_height: 0,
            microchain_id: message.source_chain.clone(),
            timestamp,
            transaction_data: None,
            contract_event_data: Some(ContractEventData {
                contract_address: message.target_chain.clone(),
                event_name: format!("CrossChainMessage:{}", message.message_type),
                event_data: message_data,
            }),
            state_change_data: None,
        })
    }
}