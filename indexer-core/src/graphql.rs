use async_graphql::{
    Context, EmptyMutation, Enum, InputObject, Object, Schema, SimpleObject, Subscription,
};
use futures::Stream;
use std::sync::Arc;
use tokio_stream::wrappers::BroadcastStream;
use tokio_stream::StreamExt;

use crate::parser::{
    ContractEventData, EventType, NormalizedEvent, StateChangeData, TransactionData,
    TransactionStatus,
};
use crate::storage::Database;

// ============================================
// GraphQL TYPE DEFINITIONS
// ============================================

/// Event type enum for GraphQL
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlEventType {
    Transaction,
    ContractEvent,
    StateChange,
    BlockFinalized,
}

impl From<EventType> for GqlEventType {
    fn from(event_type: EventType) -> Self {
        match event_type {
            EventType::Transaction => GqlEventType::Transaction,
            EventType::ContractEvent => GqlEventType::ContractEvent,
            EventType::StateChange => GqlEventType::StateChange,
            EventType::BlockFinalized => GqlEventType::BlockFinalized,
        }
    }
}

/// Transaction status enum for GraphQL
#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum GqlTransactionStatus {
    Pending,
    Success,
    Failed,
}

impl From<TransactionStatus> for GqlTransactionStatus {
    fn from(status: TransactionStatus) -> Self {
        match status {
            TransactionStatus::Pending => GqlTransactionStatus::Pending,
            TransactionStatus::Success => GqlTransactionStatus::Success,
            TransactionStatus::Failed => GqlTransactionStatus::Failed,
        }
    }
}

/// Transaction data for GraphQL
#[derive(SimpleObject)]
pub struct GqlTransactionData {
    pub transaction_id: String,
    pub from_address: String,
    pub to_address: String,
    pub amount: String,
    pub gas_used: String,
    pub status: GqlTransactionStatus,
}

impl From<TransactionData> for GqlTransactionData {
    fn from(data: TransactionData) -> Self {
        Self {
            transaction_id: data.transaction_id,
            from_address: data.from_address,
            to_address: data.to_address,
            amount: data.amount.to_string(),
            gas_used: data.gas_used.to_string(),
            status: data.status.into(),
        }
    }
}

/// Contract event data for GraphQL
#[derive(SimpleObject)]
pub struct GqlContractEventData {
    pub contract_address: String,
    pub event_name: String,
    pub event_data: String,
}

impl From<ContractEventData> for GqlContractEventData {
    fn from(data: ContractEventData) -> Self {
        Self {
            contract_address: data.contract_address,
            event_name: data.event_name,
            event_data: data.event_data.to_string(),
        }
    }
}

/// State change data for GraphQL
#[derive(SimpleObject)]
pub struct GqlStateChangeData {
    pub account_id: String,
    pub previous_state: String,
    pub new_state: String,
}

impl From<StateChangeData> for GqlStateChangeData {
    fn from(data: StateChangeData) -> Self {
        Self {
            account_id: data.account_id,
            previous_state: data.previous_state.to_string(),
            new_state: data.new_state.to_string(),
        }
    }
}

/// Normalized event for GraphQL
#[derive(SimpleObject)]
pub struct GqlEvent {
    pub id: String,
    pub event_type: GqlEventType,
    pub block_height: String,
    pub microchain_id: String,
    pub timestamp: String,
    pub transaction_data: Option<GqlTransactionData>,
    pub contract_event_data: Option<GqlContractEventData>,
    pub state_change_data: Option<GqlStateChangeData>,
}

impl From<NormalizedEvent> for GqlEvent {
    fn from(event: NormalizedEvent) -> Self {
        Self {
            id: event.id,
            event_type: event.event_type.into(),
            block_height: event.block_height.to_string(),
            microchain_id: event.microchain_id,
            timestamp: event.timestamp.to_string(),
            transaction_data: event.transaction_data.map(Into::into),
            contract_event_data: event.contract_event_data.map(Into::into),
            state_change_data: event.state_change_data.map(Into::into),
        }
    }
}

/// Database statistics for GraphQL
#[derive(SimpleObject)]
pub struct GqlStats {
    pub total_events: String,
    pub unique_microchains: String,
    pub latest_block_height: Option<String>,
}

/// Microchain info for GraphQL
#[derive(SimpleObject)]
pub struct GqlMicrochain {
    pub chain_id: String,
    pub event_count: i32,
    pub latest_block: Option<String>,
}

// ============================================
// INPUT TYPES
// ============================================

/// Input for filtering events
#[derive(InputObject, Default)]
pub struct EventFilter {
    pub microchain_id: Option<String>,
    pub event_type: Option<GqlEventType>,
    pub start_height: Option<i32>,
    pub end_height: Option<i32>,
}

/// Input for pagination
#[derive(InputObject)]
pub struct Pagination {
    #[graphql(default = 50)]
    pub limit: i32,
    #[graphql(default = 0)]
    pub offset: i32,
}

impl Default for Pagination {
    fn default() -> Self {
        Self {
            limit: 50,
            offset: 0,
        }
    }
}

// ============================================
// QUERY ROOT
// ============================================

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    /// Get indexer statistics
    async fn stats(&self, ctx: &Context<'_>) -> async_graphql::Result<GqlStats> {
        let db = ctx.data::<Arc<Database>>()?;
        let stats = db.get_stats().await?;

        Ok(GqlStats {
            total_events: stats.total_events.to_string(),
            unique_microchains: stats.unique_microchains.to_string(),
            latest_block_height: stats.latest_block_height.map(|h| h.to_string()),
        })
    }

    /// Get recent events
    async fn recent_events(
        &self,
        ctx: &Context<'_>,
        #[graphql(default = 50)] limit: i32,
    ) -> async_graphql::Result<Vec<GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;
        let events = db.get_recent_events().await?;

        Ok(events
            .into_iter()
            .take(limit as usize)
            .map(Into::into)
            .collect())
    }

    /// Get events with optional filtering
    async fn events(
        &self,
        ctx: &Context<'_>,
        #[graphql(default)] filter: EventFilter,
        #[graphql(default)] pagination: Pagination,
    ) -> async_graphql::Result<Vec<GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;

        let events = if let Some(microchain_id) = filter.microchain_id {
            db.get_events_by_microchain(&microchain_id).await?
        } else if let (Some(start), Some(end)) = (filter.start_height, filter.end_height) {
            db.get_events_by_height_range(start as u64, end as u64)
                .await?
        } else {
            db.get_recent_events().await?
        };

        Ok(events
            .into_iter()
            .skip(pagination.offset as usize)
            .take(pagination.limit as usize)
            .map(Into::into)
            .collect())
    }

    /// Get events for a specific microchain
    async fn events_by_microchain(
        &self,
        ctx: &Context<'_>,
        microchain_id: String,
        #[graphql(default = 100)] limit: i32,
    ) -> async_graphql::Result<Vec<GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;
        let events = db.get_events_by_microchain(&microchain_id).await?;

        Ok(events
            .into_iter()
            .take(limit as usize)
            .map(Into::into)
            .collect())
    }

    /// Get events in a block height range
    async fn events_by_height_range(
        &self,
        ctx: &Context<'_>,
        start_height: i32,
        end_height: i32,
    ) -> async_graphql::Result<Vec<GqlEvent>> {
        if start_height > end_height {
            return Err(async_graphql::Error::new(
                "start_height must be <= end_height",
            ));
        }

        if (end_height - start_height) > 10000 {
            return Err(async_graphql::Error::new(
                "Height range too large (max 10000 blocks)",
            ));
        }

        let db = ctx.data::<Arc<Database>>()?;
        let events = db
            .get_events_by_height_range(start_height as u64, end_height as u64)
            .await?;

        Ok(events.into_iter().map(Into::into).collect())
    }

    /// Get a single event by ID
    async fn event(
        &self,
        ctx: &Context<'_>,
        id: String,
    ) -> async_graphql::Result<Option<GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;
        let events = db.get_recent_events().await?;

        Ok(events.into_iter().find(|e| e.id == id).map(Into::into))
    }

    /// Health check
    async fn health(&self, ctx: &Context<'_>) -> async_graphql::Result<String> {
        let db = ctx.data::<Arc<Database>>()?;
        let _ = db.get_stats().await?;
        Ok("healthy".to_string())
    }
}

// ============================================
// SUBSCRIPTION ROOT
// ============================================

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    /// Subscribe to new events in real-time
    async fn events(&self, ctx: &Context<'_>) -> async_graphql::Result<impl Stream<Item = GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;
        let receiver = db.subscribe_to_events();

        let stream = BroadcastStream::new(receiver)
            .filter_map(|result| result.ok())
            .map(|event| event.into());

        Ok(stream)
    }

    /// Subscribe to events for a specific microchain
    async fn events_by_microchain(
        &self,
        ctx: &Context<'_>,
        microchain_id: String,
    ) -> async_graphql::Result<impl Stream<Item = GqlEvent>> {
        let db = ctx.data::<Arc<Database>>()?;
        let receiver = db.subscribe_to_events();

        let stream = BroadcastStream::new(receiver)
            .filter_map(|result| result.ok())
            .filter(move |event| event.microchain_id == microchain_id)
            .map(|event| event.into());

        Ok(stream)
    }
}

// ============================================
// SCHEMA BUILDER
// ============================================

pub type FluxeraSchema = Schema<QueryRoot, EmptyMutation, SubscriptionRoot>;

/// Build the GraphQL schema with the database context
pub fn build_schema(database: Arc<Database>) -> FluxeraSchema {
    Schema::build(QueryRoot, EmptyMutation, SubscriptionRoot)
        .data(database)
        .finish()
}
