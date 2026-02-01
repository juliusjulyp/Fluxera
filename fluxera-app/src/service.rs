#![cfg_attr(target_arch = "wasm32", no_main)]

mod state;

use async_graphql::{EmptySubscription, Object, Request, Response, Schema};
use fluxera_app::{FluxeraAbi, Operation};
use linera_sdk::{
    graphql::GraphQLMutationRoot,
    linera_base_types::WithServiceAbi,
    views::View,
    Service, ServiceRuntime,
};
use state::{
    AnalyticsEvent, ChainMetrics, CrossChainMessage, CrossChainMessageV2, FluxeraState,
    MessageStatus, RegisteredChain,
};
use std::sync::Arc;

#[derive(Clone)]
pub struct FluxeraService {
    state: Arc<FluxeraState>,
    runtime: Arc<ServiceRuntime<Self>>,
}

linera_sdk::service!(FluxeraService);

impl WithServiceAbi for FluxeraService {
    type Abi = FluxeraAbi;
}

impl Service for FluxeraService {
    type Parameters = ();

    async fn new(runtime: ServiceRuntime<Self>) -> Self {
        let state = FluxeraState::load(runtime.root_view_storage_context())
            .await
            .expect("Failed to load state");
        FluxeraService {
            state: Arc::new(state),
            runtime: Arc::new(runtime),
        }
    }

    async fn handle_query(&self, request: Request) -> Response {
        let schema = Schema::build(
            self.clone(),
            Operation::mutation_root(self.runtime.clone()),
            EmptySubscription,
        )
        .finish();

        schema.execute(request).await
    }
}

// Queries are implemented directly on the service
#[Object]
impl FluxeraService {
    async fn total_events(&self) -> u64 {
        *self.state.total_event_count.get()
    }

    async fn total_messages(&self) -> u64 {
        *self.state.total_messages.get()
    }

    async fn total_unique_users(&self) -> usize {
        self.state.user_event_counts.indices().await.unwrap_or_default().len()
    }

    /// Get current chain ID
    async fn chain_id(&self) -> String {
        self.runtime.chain_id().to_string()
    }

    /// Get analytics summary
    async fn analytics_summary(&self) -> AnalyticsSummary {
        AnalyticsSummary {
            total_events: *self.state.total_event_count.get(),
            total_messages: *self.state.total_messages.get(),
            unique_users: self.state.user_event_counts.indices().await.unwrap_or_default().len(),
            chain_id: self.runtime.chain_id().to_string(),
        }
    }

    /// Get recent events (last N events)
    async fn recent_events(&self, limit: Option<usize>) -> Vec<AnalyticsEvent> {
        let limit = limit.unwrap_or(10);
        let total = self.state.events.count();
        let start = if total > limit { total - limit } else { 0 };

        let mut events = Vec::new();
        for i in start..total {
            if let Ok(Some(event)) = self.state.events.get(i).await {
                events.push(event);
            }
        }
        events
    }

    /// Get all events (paginated)
    async fn events(&self, offset: Option<usize>, limit: Option<usize>) -> Vec<AnalyticsEvent> {
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);
        let total = self.state.events.count();
        let end = std::cmp::min(offset + limit, total);

        let mut events = Vec::new();
        for i in offset..end {
            if let Ok(Some(event)) = self.state.events.get(i).await {
                events.push(event);
            }
        }
        events
    }

    /// Get events by owner
    async fn events_by_owner(&self, owner: String, limit: Option<usize>) -> Vec<AnalyticsEvent> {
        let limit = limit.unwrap_or(100);
        let total = self.state.events.count();

        let mut events = Vec::new();
        for i in 0..total {
            if events.len() >= limit {
                break;
            }
            if let Ok(Some(event)) = self.state.events.get(i).await {
                if event.owner == owner {
                    events.push(event);
                }
            }
        }
        events
    }

    /// Get events by type
    async fn events_by_type(
        &self,
        event_type: String,
        limit: Option<usize>,
    ) -> Vec<AnalyticsEvent> {
        let limit = limit.unwrap_or(100);
        let total = self.state.events.count();

        let mut events = Vec::new();
        for i in 0..total {
            if events.len() >= limit {
                break;
            }
            if let Ok(Some(event)) = self.state.events.get(i).await {
                if event.event_type == event_type {
                    events.push(event);
                }
            }
        }
        events
    }

    /// Get chain metrics for a specific chain
    async fn chain_metrics(&self, chain_id: String) -> Option<ChainMetrics> {
        self.state
            .chain_metrics
            .get(&chain_id)
            .await
            .ok()
            .flatten()
    }

    /// Get all chain metrics
    async fn all_chain_metrics(&self) -> Vec<ChainMetricsWithId> {
        let mut metrics = Vec::new();
        let keys = self.state.chain_metrics.indices().await.unwrap_or_default();

        for chain_id in keys {
            if let Ok(Some(chain_metrics)) = self.state.chain_metrics.get(&chain_id).await {
                metrics.push(ChainMetricsWithId {
                    chain_id,
                    metrics: chain_metrics,
                });
            }
        }
        metrics
    }

    /// Get user event count
    async fn user_event_count(&self, owner: String) -> u64 {
        self.state
            .user_event_counts
            .get(&owner)
            .await
            .ok()
            .flatten()
            .unwrap_or(0)
    }

    /// Get recent cross-chain messages
    async fn recent_messages(&self, limit: Option<usize>) -> Vec<CrossChainMessage> {
        let limit = limit.unwrap_or(10);
        let total = self.state.cross_chain_messages.count();
        let start = if total > limit { total - limit } else { 0 };

        let mut messages = Vec::new();
        for i in start..total {
            if let Ok(Some(message)) = self.state.cross_chain_messages.get(i).await {
                messages.push(message);
            }
        }
        messages
    }

    /// Get all cross-chain messages (paginated)
    async fn messages(
        &self,
        offset: Option<usize>,
        limit: Option<usize>,
    ) -> Vec<CrossChainMessage> {
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);
        let total = self.state.cross_chain_messages.count();
        let end = std::cmp::min(offset + limit, total);

        let mut messages = Vec::new();
        for i in offset..end {
            if let Ok(Some(message)) = self.state.cross_chain_messages.get(i).await {
                messages.push(message);
            }
        }
        messages
    }

    // === Wave 6: Multi-Chain Support Queries ===

    /// Get message status by ID
    async fn message_status(&self, message_id: String) -> Option<CrossChainMessageV2> {
        self.state
            .messages_v2
            .get(&message_id)
            .await
            .ok()
            .flatten()
    }

    /// Get all messages with status (paginated)
    async fn messages_with_status(
        &self,
        offset: Option<usize>,
        limit: Option<usize>,
    ) -> Vec<CrossChainMessageV2> {
        let offset = offset.unwrap_or(0);
        let limit = limit.unwrap_or(100);
        let keys = self.state.messages_v2.indices().await.unwrap_or_default();

        let mut messages = Vec::new();
        for (i, message_id) in keys.iter().enumerate() {
            if i < offset {
                continue;
            }
            if messages.len() >= limit {
                break;
            }
            if let Ok(Some(message)) = self.state.messages_v2.get(message_id).await {
                messages.push(message);
            }
        }
        messages
    }

    /// Get all pending (non-delivered) messages
    async fn pending_messages(&self) -> Vec<CrossChainMessageV2> {
        let keys = self.state.messages_v2.indices().await.unwrap_or_default();

        let mut messages = Vec::new();
        for message_id in keys {
            if let Ok(Some(message)) = self.state.messages_v2.get(&message_id).await {
                if message.status != MessageStatus::Delivered {
                    messages.push(message);
                }
            }
        }
        messages
    }

    /// Get messages by status
    async fn messages_by_status(&self, status: MessageStatus) -> Vec<CrossChainMessageV2> {
        let keys = self.state.messages_v2.indices().await.unwrap_or_default();

        let mut messages = Vec::new();
        for message_id in keys {
            if let Ok(Some(message)) = self.state.messages_v2.get(&message_id).await {
                if message.status == status {
                    messages.push(message);
                }
            }
        }
        messages
    }

    /// Get all registered chains
    async fn registered_chains(&self) -> Vec<RegisteredChain> {
        let keys = self.state.registered_chains.indices().await.unwrap_or_default();

        let mut chains = Vec::new();
        for chain_id in keys {
            if let Ok(Some(chain)) = self.state.registered_chains.get(&chain_id).await {
                chains.push(chain);
            }
        }
        chains
    }

    /// Get a specific registered chain
    async fn registered_chain(&self, chain_id: String) -> Option<RegisteredChain> {
        self.state
            .registered_chains
            .get(&chain_id)
            .await
            .ok()
            .flatten()
    }
}

// Helper type for returning chain metrics with ID
#[derive(async_graphql::SimpleObject)]
struct ChainMetricsWithId {
    chain_id: String,
    metrics: ChainMetrics,
}

// Analytics summary type
#[derive(async_graphql::SimpleObject)]
struct AnalyticsSummary {
    total_events: u64,
    total_messages: u64,
    unique_users: usize,
    chain_id: String,
}
