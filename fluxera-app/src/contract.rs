#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use fluxera_app::{FluxeraAbi, Message, Operation};
use linera_sdk::{
    linera_base_types::WithContractAbi,
    views::{RootView, View},
    Contract, ContractRuntime,
};
use state::{AnalyticsEvent, ChainMetrics, CrossChainMessage, FluxeraState};

pub struct FluxeraContract {
    state: FluxeraState,
    runtime: ContractRuntime<Self>,
}

linera_sdk::contract!(FluxeraContract);

impl WithContractAbi for FluxeraContract {
    type Abi = FluxeraAbi;
}

impl Contract for FluxeraContract {
    type Message = Message;
    type InstantiationArgument = ();
    type Parameters = ();
    type EventValue = ();

    async fn load(runtime: ContractRuntime<Self>) -> Self {
        let state = FluxeraState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FluxeraContract { state, runtime }
    }

    async fn instantiate(&mut self, _argument: ()) {
        self.state.total_event_count.set(0);
        self.state.total_messages.set(0);
    }

    async fn execute_operation(&mut self, operation: Operation) -> String {
        match operation {
            Operation::TrackEvent { event_type, data } => {
                self.track_event(event_type, data).await
            }
            Operation::SendCrossChainMessage {
                target_chain,
                message_type,
                payload,
            } => {
                self.send_cross_chain_message(target_chain, message_type, payload)
                    .await
            }
        }
    }

    async fn execute_message(&mut self, message: Message) {
        match message {
            Message::CrossChainEvent {
                event_type,
                data,
                source_chain,
                timestamp,
            } => {
                self.handle_cross_chain_event(event_type, data, source_chain, timestamp)
                    .await;
            }
            Message::MetricsRequest { requesting_chain } => {
                self.handle_metrics_request(requesting_chain).await;
            }
            Message::MetricsResponse {
                total_events,
                unique_users,
            } => {
                self.handle_metrics_response(total_events, unique_users)
                    .await;
            }
        }
    }

    async fn store(mut self) {
        self.state.save().await.expect("Failed to save state");
    }
}

impl FluxeraContract {
    /// Tracking a new analytics event
    async fn track_event(&mut self, event_type: String, data: String) -> String {
        let chain_id = self.runtime.chain_id().to_string();
        let owner = match self.runtime.authenticated_signer() {
            Some(owner) => owner.to_string(),
            None => "anonymous".to_string(),
        };
        let timestamp = self.runtime.system_time().to_string();

        // Generate event ID
        let event_count = *self.state.total_event_count.get();
        let event_id = format!("{}-{}", chain_id, event_count);

        // Create event
        let event = AnalyticsEvent {
            event_id: event_id.clone(),
            event_type: event_type.clone(),
            owner: owner.clone(),
            timestamp: timestamp.clone(),
            data: data.clone(),
            chain_id: chain_id.clone(),
        };

        // Store event in log
        self.state.events.push(event);

        // Update total count
        self.state.total_event_count.set(event_count + 1);

        // Update user event count
        let user_count = self
            .state
            .user_event_counts
            .get(&owner)
            .await
            .expect("Failed to get user count")
            .unwrap_or(0);
        self.state
            .user_event_counts
            .insert(&owner, user_count + 1)
            .expect("Failed to update user count");

        // Update chain metrics
        self.update_chain_metrics(&chain_id, &event_type).await;

        // Event is  stored on-chain and can be indexed

        // Return success response
        serde_json::json!({
            "success": true,
            "event_id": event_id,
            "timestamp": timestamp
        })
        .to_string()
    }

    /// Send a cross-chain analytics message
    async fn send_cross_chain_message(
        &mut self,
        target_chain: String,
        message_type: String,
        payload: String,
    ) -> String {
        let source_chain = self.runtime.chain_id().to_string();
        let timestamp = self.runtime.system_time().to_string();

        // Generate message ID
        let message_count = *self.state.total_messages.get();
        let message_id = format!("{}-msg-{}", source_chain, message_count);

        // Parse target chain ID
        let target_chain_id = target_chain
            .parse()
            .expect("Invalid target chain ID");

        // Create message record
        let message_record = CrossChainMessage {
            message_id: message_id.clone(),
            source_chain: source_chain.clone(),
            target_chain: target_chain.clone(),
            message_type: message_type.clone(),
            sent_at: timestamp.clone(),
            payload: payload.clone(),
        };

        // Store message record
        self.state.cross_chain_messages.push(message_record);

        self.state.total_messages.set(message_count + 1);

        // Send the message
        let message = Message::CrossChainEvent {
            event_type: message_type.clone(),
            data: payload,
            source_chain,
            timestamp: timestamp.clone(),
        };

        self.runtime
            .prepare_message(message)
            .send_to(target_chain_id);

        // Message recorded on-chain

        // Return success response
        serde_json::json!({
            "success": true,
            "message_id": message_id,
            "timestamp": timestamp
        })
        .to_string()
    }

    /// Handle incoming cross-chain event
    async fn handle_cross_chain_event(
        &mut self,
        event_type: String,
        data: String,
        source_chain: String,
        timestamp: String,
    ) {
        let chain_id = self.runtime.chain_id().to_string();
        let event_count = *self.state.total_event_count.get();
        let event_id = format!("{}-xchain-{}", chain_id, event_count);

        // Create event for cross-chain activity
        let event = AnalyticsEvent {
            event_id: event_id.clone(),
            event_type: format!("cross_chain_{}", event_type),
            owner: format!("chain:{}", source_chain),
            timestamp,
            data,
            chain_id: chain_id.clone(),
        };

        // Store event
        self.state.events.push(event);
        self.state.total_event_count.set(event_count + 1);

        // Update metrics
        self.update_chain_metrics(&chain_id, &event_type).await;

        // Cross-chain message processed
    }

    /// Handle metrics request from another chain
    async fn handle_metrics_request(&mut self, requesting_chain: String) {
        let total_events = *self.state.total_event_count.get();

        // Count unique users
        let unique_users = self.state.user_event_counts.indices().await.unwrap_or_default().len();

        // Send response message
        let message = Message::MetricsResponse {
            total_events,
            unique_users,
        };

        let target_chain_id = requesting_chain
            .parse()
            .expect("Invalid requesting chain ID");

        self.runtime
            .prepare_message(message)
            .send_to(target_chain_id);
    }

    /// Handle metrics response from another chain
    async fn handle_metrics_response(&mut self, _total_events: u64, _unique_users: usize) {
        // Store or process metrics from other chains
        // This could be extended to aggregate cross-chain metrics
    }

    /// Update chain-level metrics
    async fn update_chain_metrics(&mut self, chain_id: &str, event_type: &str) {
        let timestamp = self.runtime.system_time().to_string();

        // Get existing metrics or create new
        let mut metrics = self
            .state
            .chain_metrics
            .get(chain_id)
            .await
            .expect("Failed to get chain metrics")
            .unwrap_or(ChainMetrics {
                total_events: 0,
                unique_users: 0,
                last_activity: "0".to_string(),
                event_types: "{}".to_string(),
            });

        // Update metrics
        metrics.total_events += 1;
        metrics.last_activity = timestamp;
        metrics.unique_users = self.state.user_event_counts.indices().await.unwrap_or_default().len() as u64;

        // Update event types count (simplified - just storing as JSON string)
        let mut event_types: serde_json::Value =
            serde_json::from_str(&metrics.event_types).unwrap_or(serde_json::json!({}));
        if let Some(obj) = event_types.as_object_mut() {
            let count = obj
                .get(event_type)
                .and_then(|v| v.as_u64())
                .unwrap_or(0);
            obj.insert(event_type.to_string(), serde_json::json!(count + 1));
        }
        metrics.event_types = event_types.to_string();

        // Store updated metrics
        self.state
            .chain_metrics
            .insert(chain_id, metrics)
            .expect("Failed to update chain metrics");
    }
}
