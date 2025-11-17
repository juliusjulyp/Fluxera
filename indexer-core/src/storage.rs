use anyhow::Result;
use sqlx::{SqlitePool, Row};
use tokio::sync::broadcast;
use crate::parser::NormalizedEvent;

/// Database abstraction for storing normalized events
#[derive(Clone)]
pub struct Database {
    pool: SqlitePool,
    /// Broadcast channel for real-time event notifications
    event_broadcaster: broadcast::Sender<NormalizedEvent>,
}

impl Database {
    /// Create a new database connection pool
    pub async fn new() -> Result<Self> {
        println!("🗄️  Initializing SQLite database...");

        // Create SQLite database in local file
        let database_url = "sqlite:fluxera.db?mode=rwc";
        let pool = SqlitePool::connect(database_url).await?;

        // Create broadcast channel for real-time event streaming
        // Capacity: 100 events buffered if clients are slow to receive
        let (event_broadcaster, _) = broadcast::channel(100);

        let db = Self {
            pool,
            event_broadcaster,
        };

        // Initialize tables
        db.initialize_tables().await?;

        println!("✅ Database initialized successfully");
        println!("📡 Event broadcasting system ready");
        Ok(db)
    }
    
    /// Initialize database tables if they don't exist
    async fn initialize_tables(&self) -> Result<()> {
        println!("📋 Creating database tables...");
        
        // Create events table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS events (
                id TEXT PRIMARY KEY,
                event_type TEXT NOT NULL,
                block_height INTEGER NOT NULL,
                microchain_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                transaction_data TEXT,
                contract_event_data TEXT,
                state_change_data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create index on block_height for efficient queries
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_events_block_height 
            ON events(block_height)
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create index on microchain_id for efficient queries
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_events_microchain_id 
            ON events(microchain_id)
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        // Create index on timestamp for efficient queries
        sqlx::query(
            r#"
            CREATE INDEX IF NOT EXISTS idx_events_timestamp 
            ON events(timestamp)
            "#,
        )
        .execute(&self.pool)
        .await?;
        
        println!("✅ Database tables created successfully");
        Ok(())
    }
    
    /// Store a normalized event in the database and broadcast to subscribers
    pub async fn store_event(&self, event: NormalizedEvent) -> Result<()> {
        println!("💾 Storing event: {}", event.id);

        let transaction_data = event.transaction_data
            .as_ref()
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        let contract_event_data = event.contract_event_data
            .as_ref()
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        let state_change_data = event.state_change_data
            .as_ref()
            .map(|data| serde_json::to_string(&data))
            .transpose()?;

        sqlx::query(
            r#"
            INSERT OR REPLACE INTO events (
                id, event_type, block_height, microchain_id, timestamp,
                transaction_data, contract_event_data, state_change_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(&event.id)
        .bind(format!("{:?}", event.event_type))
        .bind(event.block_height as i64)
        .bind(&event.microchain_id)
        .bind(event.timestamp as i64)
        .bind(transaction_data)
        .bind(contract_event_data)
        .bind(state_change_data)
        .execute(&self.pool)
        .await?;

        println!("✅ Event stored successfully: {}", event.id);

        // Broadcast event to all WebSocket subscribers
        // We ignore errors here - if no one is listening, that's okay
        let _ = self.event_broadcaster.send(event.clone());
        println!("📡 Event broadcasted to subscribers");

        Ok(())
    }

    /// Subscribe to real-time event stream
    /// Returns a receiver that will get all new events as they're stored
    pub fn subscribe_to_events(&self) -> broadcast::Receiver<NormalizedEvent> {
        self.event_broadcaster.subscribe()
    }
    
    /// Get events by microchain ID
    pub async fn get_events_by_microchain(&self, microchain_id: &str) -> Result<Vec<NormalizedEvent>> {
        println!("🔍 Fetching events for microchain: {}", microchain_id);
        
        let rows = sqlx::query(
            r#"
            SELECT * FROM events 
            WHERE microchain_id = ? 
            ORDER BY block_height DESC, timestamp DESC
            LIMIT 100
            "#,
        )
        .bind(microchain_id)
        .fetch_all(&self.pool)
        .await?;
        
        let mut events = Vec::new();
        for row in rows {
            let event = self.row_to_event(row)?;
            events.push(event);
        }
        
        println!("📊 Found {} events for microchain {}", events.len(), microchain_id);
        Ok(events)
    }
    
    /// Get events by block height range
    pub async fn get_events_by_height_range(&self, start: u64, end: u64) -> Result<Vec<NormalizedEvent>> {
        println!("🔍 Fetching events for block height range: {} - {}", start, end);
        
        let rows = sqlx::query(
            r#"
            SELECT * FROM events 
            WHERE block_height >= ? AND block_height <= ?
            ORDER BY block_height DESC, timestamp DESC
            "#,
        )
        .bind(start as i64)
        .bind(end as i64)
        .fetch_all(&self.pool)
        .await?;
        
        let mut events = Vec::new();
        for row in rows {
            let event = self.row_to_event(row)?;
            events.push(event);
        }
        
        println!("📊 Found {} events in height range {} - {}", events.len(), start, end);
        Ok(events)
    }
    
    /// Get recent events (last 50)
    pub async fn get_recent_events(&self) -> Result<Vec<NormalizedEvent>> {
        println!("🔍 Fetching recent events...");
        
        let rows = sqlx::query(
            r#"
            SELECT * FROM events 
            ORDER BY timestamp DESC, block_height DESC
            LIMIT 50
            "#,
        )
        .fetch_all(&self.pool)
        .await?;
        
        let mut events = Vec::new();
        for row in rows {
            let event = self.row_to_event(row)?;
            events.push(event);
        }
        
        println!("📊 Found {} recent events", events.len());
        Ok(events)
    }
    
    /// Get database statistics
    pub async fn get_stats(&self) -> Result<DatabaseStats> {
        println!("📊 Fetching database statistics...");
        
        let total_events: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM events"
        )
        .fetch_one(&self.pool)
        .await?;
        
        let unique_chains: i64 = sqlx::query_scalar(
            "SELECT COUNT(DISTINCT microchain_id) FROM events"
        )
        .fetch_one(&self.pool)
        .await?;
        
        let latest_block: Option<i64> = sqlx::query_scalar(
            "SELECT MAX(block_height) FROM events"
        )
        .fetch_optional(&self.pool)
        .await?
        .flatten();
        
        let stats = DatabaseStats {
            total_events: total_events as u64,
            unique_microchains: unique_chains as u64,
            latest_block_height: latest_block.map(|h| h as u64),
        };
        
        println!("📊 Database stats: {} events, {} chains, latest block: {:?}", 
                 stats.total_events, stats.unique_microchains, stats.latest_block_height);
        
        Ok(stats)
    }
    
    /// Convert database row to NormalizedEvent
    fn row_to_event(&self, row: sqlx::sqlite::SqliteRow) -> Result<NormalizedEvent> {
        use crate::parser::{EventType, TransactionData, ContractEventData, StateChangeData};
        
        let event_type_str: String = row.get("event_type");
        let event_type = match event_type_str.as_str() {
            "Transaction" => EventType::Transaction,
            "ContractEvent" => EventType::ContractEvent,
            "StateChange" => EventType::StateChange,
            "BlockFinalized" => EventType::BlockFinalized,
            _ => EventType::BlockFinalized, // Default fallback
        };
        
        let transaction_data: Option<String> = row.get("transaction_data");
        let transaction_data = match transaction_data {
            Some(data) => Some(serde_json::from_str::<TransactionData>(&data)?),
            None => None,
        };
        
        let contract_event_data: Option<String> = row.get("contract_event_data");
        let contract_event_data = match contract_event_data {
            Some(data) => Some(serde_json::from_str::<ContractEventData>(&data)?),
            None => None,
        };
        
        let state_change_data: Option<String> = row.get("state_change_data");
        let state_change_data = match state_change_data {
            Some(data) => Some(serde_json::from_str::<StateChangeData>(&data)?),
            None => None,
        };
        
        Ok(NormalizedEvent {
            id: row.get("id"),
            event_type,
            block_height: row.get::<i64, _>("block_height") as u64,
            microchain_id: row.get("microchain_id"),
            timestamp: row.get::<i64, _>("timestamp") as u64,
            transaction_data,
            contract_event_data,
            state_change_data,
        })
    }
}

/// Database statistics structure
#[derive(Debug, Clone, serde::Serialize)]
pub struct DatabaseStats {
    pub total_events: u64,
    pub unique_microchains: u64,
    pub latest_block_height: Option<u64>,
}