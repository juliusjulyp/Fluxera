use anyhow::Result;
use serde::{Deserialize, Serialize};
use crate::listener::RawLineraEvent;

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
    
    /// Parse raw Linera event into normalized format
    pub fn parse(&self, raw_event: RawLineraEvent) -> Result<NormalizedEvent> {
        let event_type = match raw_event.event_type {
            crate::listener::LineraEventType::Transaction => EventType::Transaction,
            crate::listener::LineraEventType::ApplicationCall => EventType::ContractEvent,
            crate::listener::LineraEventType::BlockConfirmation => EventType::BlockFinalized,
            crate::listener::LineraEventType::BlockProposal => EventType::BlockFinalized,
            crate::listener::LineraEventType::CrossChainMessage => EventType::StateChange,
        };
        
        // Generate unique ID for this event
        let id = format!("{}_{}_{}",
            raw_event.chain_id,
            raw_event.block_height.0,
            raw_event.timestamp.micros()
        );
        
        let normalized = NormalizedEvent {
            id,
            event_type: event_type.clone(),
            block_height: raw_event.block_height.0,
            microchain_id: raw_event.chain_id.to_string(),
            timestamp: raw_event.timestamp.micros(),
            transaction_data: raw_event.transaction_data.map(|td| TransactionData {
                transaction_id: td.hash.to_string(),
                from_address: td.authenticated_signer.unwrap_or("unknown".to_string()),
                to_address: "unknown".to_string(), // Not available in raw data
                amount: 0, // Not available in raw data
                gas_used: 0, // Not available in raw data
                status: TransactionStatus::Success,
            }),
            contract_event_data: raw_event.application_data.map(|ad| ContractEventData {
                contract_address: ad.application_id.to_string(),
                event_name: ad.operation,
                event_data: serde_json::json!({}), // BCS data would need decoding
            }),
            state_change_data: None, // Would need to be parsed from specific event types
        };
        
        Ok(normalized)
    }
}