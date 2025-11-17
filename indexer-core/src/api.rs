use anyhow::Result;
use axum::{
    extract::{ws::{WebSocket, WebSocketUpgrade}, Path, Query, State},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

use crate::parser::NormalizedEvent;
use crate::storage::{Database, DatabaseStats};

/// REST API server for querying indexed data
#[derive(Clone)]
pub struct RestServer {
    database: Database,
}

/// Query parameters for event filtering
#[derive(Debug, Deserialize)]
pub struct EventQuery {
    pub microchain_id: Option<String>,
    pub start_height: Option<u64>,
    pub end_height: Option<u64>,
    pub limit: Option<u64>,
}

/// API response wrapper
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
    pub count: Option<usize>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            count: None,
        }
    }
    
    pub fn success_with_count(data: T, count: usize) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
            count: Some(count),
        }
    }
    
    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
            count: None,
        }
    }
}

impl RestServer {
    pub fn new(database: Database) -> Self {
        Self { database }
    }
    
    /// Start the REST API server
    pub async fn start(&self, addr: &str) -> Result<()> {
        println!("🌐 Starting REST API server on: {}", addr);
        
        let app_state = Arc::new(self.database.clone());
        
        let app = Router::new()
            .route("/", get(root_handler))
            .route("/health", get(health_handler))
            .route("/stats", get(stats_handler))
            .route("/events", get(events_handler))
            .route("/events/recent", get(recent_events_handler))
            .route("/events/microchain/:chain_id", get(microchain_events_handler))
            .route("/events/height/:start/:end", get(height_range_events_handler))
            .route("/ws", get(websocket_handler))
            .layer(CorsLayer::permissive())
            .with_state(app_state);
        
        println!("🔧 Attempting to bind to: {}", addr);
        let listener = TcpListener::bind(addr).await?;
        println!("✅ REST API server listening on: {}", addr);
        println!("🔧 Actual listener address: {:?}", listener.local_addr());
        println!("📖 Available endpoints:");
        println!("   GET /              - API information");
        println!("   GET /health        - Health check");
        println!("   GET /stats         - Database statistics");
        println!("   GET /events        - Query events with filters");
        println!("   GET /events/recent - Get recent events");
        println!("   GET /events/microchain/:chain_id - Get events for specific microchain");
        println!("   GET /events/height/:start/:end - Get events in block height range");
        println!("   WS  /ws            - WebSocket real-time event stream");
        
        println!("🚀 Starting axum server...");
        axum::serve(listener, app).await?;
        
        Ok(())
    }
}

/// Root endpoint - API information
async fn root_handler() -> Json<ApiResponse<serde_json::Value>> {
    let info = serde_json::json!({
        "name": "Fluxera Indexer API",
        "version": "0.1.0",
        "description": "REST API for querying indexed Linera microchain data",
        "endpoints": {
            "health": "GET /health - Service health check",
            "stats": "GET /stats - Database statistics",
            "events": "GET /events?microchain_id=X&start_height=Y&end_height=Z&limit=N - Query events",
            "recent": "GET /events/recent - Get recent events",
            "microchain": "GET /events/microchain/:chain_id - Get events for specific microchain",
            "height_range": "GET /events/height/:start/:end - Get events in block height range"
        }
    });
    
    Json(ApiResponse::success(info))
}

/// Health check endpoint
async fn health_handler(
    State(database): State<Arc<Database>>,
) -> Result<Json<ApiResponse<serde_json::Value>>, StatusCode> {
    match database.get_stats().await {
        Ok(stats) => {
            let health = serde_json::json!({
                "status": "healthy",
                "database": "connected",
                "total_events": stats.total_events,
                "unique_microchains": stats.unique_microchains,
                "latest_block": stats.latest_block_height
            });
            Ok(Json(ApiResponse::success(health)))
        }
        Err(e) => {
            eprintln!("Health check failed: {}", e);
            let health = serde_json::json!({
                "status": "unhealthy",
                "database": "error",
                "error": e.to_string()
            });
            Ok(Json(ApiResponse::success(health)))
        }
    }
}

/// Database statistics endpoint
async fn stats_handler(
    State(database): State<Arc<Database>>,
) -> Result<Json<ApiResponse<DatabaseStats>>, StatusCode> {
    match database.get_stats().await {
        Ok(stats) => Ok(Json(ApiResponse::success(stats))),
        Err(e) => {
            eprintln!("Failed to get stats: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Query events with optional filters
async fn events_handler(
    State(database): State<Arc<Database>>,
    Query(params): Query<EventQuery>,
) -> Result<Json<ApiResponse<Vec<NormalizedEvent>>>, StatusCode> {
    println!("🔍 API: Query events with params: {:?}", params);
    
    let events = if let Some(microchain_id) = params.microchain_id {
        // Query by microchain ID
        match database.get_events_by_microchain(&microchain_id).await {
            Ok(events) => events,
            Err(e) => {
                eprintln!("Failed to query events by microchain: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    } else if let (Some(start), Some(end)) = (params.start_height, params.end_height) {
        // Query by height range
        match database.get_events_by_height_range(start, end).await {
            Ok(events) => events,
            Err(e) => {
                eprintln!("Failed to query events by height range: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    } else {
        // Get recent events
        match database.get_recent_events().await {
            Ok(events) => events,
            Err(e) => {
                eprintln!("Failed to query recent events: {}", e);
                return Err(StatusCode::INTERNAL_SERVER_ERROR);
            }
        }
    };
    
    // Apply limit if specified
    let limited_events = if let Some(limit) = params.limit {
        events.into_iter().take(limit as usize).collect()
    } else {
        events
    };
    
    let count = limited_events.len();
    Ok(Json(ApiResponse::success_with_count(limited_events, count)))
}

/// Get recent events
async fn recent_events_handler(
    State(database): State<Arc<Database>>,
) -> Result<Json<ApiResponse<Vec<NormalizedEvent>>>, StatusCode> {
    println!("📋 API: Get recent events");
    
    match database.get_recent_events().await {
        Ok(events) => {
            let count = events.len();
            Ok(Json(ApiResponse::success_with_count(events, count)))
        }
        Err(e) => {
            eprintln!("Failed to get recent events: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get events for specific microchain
async fn microchain_events_handler(
    State(database): State<Arc<Database>>,
    Path(chain_id): Path<String>,
) -> Result<Json<ApiResponse<Vec<NormalizedEvent>>>, StatusCode> {
    println!("🔗 API: Get events for microchain: {}", chain_id);
    
    match database.get_events_by_microchain(&chain_id).await {
        Ok(events) => {
            let count = events.len();
            Ok(Json(ApiResponse::success_with_count(events, count)))
        }
        Err(e) => {
            eprintln!("Failed to get events for microchain {}: {}", chain_id, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// Get events in block height range
async fn height_range_events_handler(
    State(database): State<Arc<Database>>,
    Path((start, end)): Path<(u64, u64)>,
) -> Result<Json<ApiResponse<Vec<NormalizedEvent>>>, StatusCode> {
    println!("📏 API: Get events for height range: {} - {}", start, end);
    
    if start > end {
        return Ok(Json(ApiResponse::error("start_height must be <= end_height".to_string())));
    }
    
    if end - start > 10000 {
        return Ok(Json(ApiResponse::error("height range too large (max 10000 blocks)".to_string())));
    }
    
    match database.get_events_by_height_range(start, end).await {
        Ok(events) => {
            let count = events.len();
            Ok(Json(ApiResponse::success_with_count(events, count)))
        }
        Err(e) => {
            eprintln!("Failed to get events for height range {} - {}: {}", start, end, e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

/// WebSocket handler for real-time event streaming
async fn websocket_handler(
    ws: WebSocketUpgrade,
    State(database): State<Arc<Database>>,
) -> impl IntoResponse {
    println!("🔌 New WebSocket connection request");
    ws.on_upgrade(move |socket| websocket_connection(socket, database))
}

/// Handle individual WebSocket connection
async fn websocket_connection(socket: WebSocket, database: Arc<Database>) {
    println!("✅ WebSocket connection established");

    let (mut sender, mut receiver) = socket.split();

    // Subscribe to event broadcasts
    let mut event_receiver = database.subscribe_to_events();

    // Send initial connection success message
    let welcome_msg = serde_json::json!({
        "type": "connected",
        "message": "Real-time event stream connected",
        "timestamp": chrono::Utc::now().timestamp()
    });

    match serde_json::to_string(&welcome_msg) {
        Ok(msg_text) => {
            if let Err(e) = sender.send(axum::extract::ws::Message::Text(msg_text)).await {
                println!("❌ Failed to send welcome message: {}", e);
                return; // Exit early if we can't even send the welcome message
            }
            println!("✅ Welcome message sent to client");
        }
        Err(e) => {
            println!("❌ Failed to serialize welcome message: {}", e);
            return;
        }
    }

    // Spawn task to handle incoming messages (ping/pong, etc.)
    let mut recv_task = tokio::spawn(async move {
        while let Some(msg_result) = receiver.next().await {
            match msg_result {
                Ok(msg) => {
                    match msg {
                        axum::extract::ws::Message::Close(_) => {
                            println!("🔌 Client initiated close");
                            break;
                        }
                        axum::extract::ws::Message::Ping(_) => {
                            println!("🏓 Received ping from client");
                            // Axum handles pong automatically
                        }
                        axum::extract::ws::Message::Pong(_) => {
                            println!("🏓 Received pong from client");
                        }
                        _ => {
                            // Ignore other client messages
                        }
                    }
                }
                Err(e) => {
                    println!("❌ WebSocket receive error: {}", e);
                    break;
                }
            }
        }
        println!("🔌 Receive task ending");
    });

    // Main loop: forward broadcasted events to WebSocket
    let mut send_task = tokio::spawn(async move {
        println!("📡 Send task started, waiting for events...");
        loop {
            tokio::select! {
                // Receive event from broadcast channel
                event_result = event_receiver.recv() => {
                    match event_result {
                        Ok(event) => {
                            // Serialize event to JSON
                            match serde_json::to_string(&event) {
                                Ok(json_str) => {
                                    // Send to WebSocket client
                                    if sender.send(axum::extract::ws::Message::Text(json_str)).await.is_err() {
                                        println!("❌ Failed to send event to WebSocket client");
                                        break;
                                    }
                                    println!("📤 Event sent to WebSocket client: {}", event.id);
                                }
                                Err(e) => {
                                    eprintln!("Failed to serialize event: {}", e);
                                }
                            }
                        }
                        Err(tokio::sync::broadcast::error::RecvError::Lagged(skipped)) => {
                            println!("⚠️  WebSocket client lagged, skipped {} events", skipped);
                            // Send a lag notification to client
                            let lag_msg = serde_json::json!({
                                "type": "lag_warning",
                                "skipped_events": skipped,
                                "message": "Client connection lagged behind event stream"
                            });
                            if let Ok(msg_text) = serde_json::to_string(&lag_msg) {
                                let _ = sender.send(axum::extract::ws::Message::Text(msg_text)).await;
                            }
                        }
                        Err(tokio::sync::broadcast::error::RecvError::Closed) => {
                            println!("📡 Event broadcast channel closed");
                            break;
                        }
                    }
                }
            }
        }
        println!("📡 Send task ending");
    });

    // Wait for either task to finish
    tokio::select! {
        result = (&mut send_task) => {
            println!("📡 Send task completed: {:?}", result);
            recv_task.abort();
        }
        result = (&mut recv_task) => {
            println!("🔌 Receive task completed: {:?}", result);
            send_task.abort();
        }
    };

    println!("🔌 WebSocket connection closed");
}