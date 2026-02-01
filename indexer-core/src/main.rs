use anyhow::Result;
use tokio;
use clap::{Arg, Command};
use std::sync::Arc;
use std::time::Duration;

mod listener;
mod parser;
mod storage;
mod api;
mod graphql;

use listener::LineraListener;
use parser::EventParser;
use storage::Database;
use api::RestServer;

#[tokio::main]
async fn main() -> Result<()> {
    let matches = Command::new("fluxera")
        .version("0.1.0")
        .about("Linera Data Availability & Indexing Layer")
        .arg(Arg::new("test-connection")
            .long("test-connection")
            .help("Test connection to Linera service without starting indexer")
            .action(clap::ArgAction::SetTrue))
        .arg(Arg::new("service-url")
            .long("service-url")
            .value_name("URL")
            .help("Linera GraphQL service URL")
            .default_value("http://localhost:8080"))
        .get_matches();

    println!("🌊 Starting Fluxera Indexer...");
    
    let service_url = matches.get_one::<String>("service-url").unwrap();
    println!("🔗 Using Linera service: {}", service_url);
    
    // Connect to Linera GraphQL service
    let mut listener = LineraListener::new(service_url).await?;
    
    // Test the connection
    println!("🧪 Testing Linera service connection...");
    match listener.health_check().await {
        Ok(true) => {
            println!("✅ Linera service is accessible");
            
            // Test chain discovery
            println!("🔍 Testing chain discovery...");
            match listener.discover_chains().await {
                Ok(_) => println!("✅ Chain discovery completed"),
                Err(e) => println!("⚠️  Chain discovery failed: {}", e),
            }
        },
        Ok(false) => {
            println!("⚠️  Linera service not accessible");
        },
        Err(e) => {
            println!("⚠️  Linera service connection error: {:?}", e);
            println!("   To test with local service, run: linera service --port 8080");
            println!("   To test with Conway testnet, use: --service-url <testnet-url>");
        }
    }
    
    // If --test-connection flag is set, exit after testing
    if matches.get_flag("test-connection") {
        println!("🏁 Connection test completed. Exiting.");
        return Ok(());
    }
    
    // Initialize remaining components for full indexer
    let database = Database::new().await?;
    let parser = Arc::new(EventParser::new());
    let api_server = RestServer::new(database.clone());

    println!("✅ All components initialized successfully");

    // Clone for the event loop
    let db_for_loop = database.clone();
    let parser_for_loop = parser.clone();
    let listener = Arc::new(tokio::sync::Mutex::new(listener));

    // Spawn the event listening loop
    let event_loop_handle = tokio::spawn(async move {
        event_listening_loop(listener, db_for_loop, parser_for_loop).await
    });

    // Start API server in a separate task
    let api_handle = tokio::spawn(async move {
        println!("🔄 Starting API server...");
        if let Err(e) = api_server.start("0.0.0.0:3001").await {
            eprintln!("❌ API server error: {}", e);
        }
    });

    // Wait for either task to complete (or fail)
    tokio::select! {
        result = event_loop_handle => {
            match result {
                Ok(Ok(())) => println!("📡 Event loop completed"),
                Ok(Err(e)) => eprintln!("❌ Event loop error: {}", e),
                Err(e) => eprintln!("❌ Event loop task panic: {}", e),
            }
        }
        result = api_handle => {
            match result {
                Ok(()) => println!("🌐 API server stopped"),
                Err(e) => eprintln!("❌ API server task panic: {}", e),
            }
        }
    }

    Ok(())
}

/// Event listening loop that polls Fluxera data and stores in database
async fn event_listening_loop(
    listener: Arc<tokio::sync::Mutex<LineraListener>>,
    database: Database,
    parser: Arc<EventParser>,
) -> Result<()> {
    println!("📡 Starting event listening loop...");

    let poll_interval = Duration::from_secs(5);
    let mut last_event_count: u64 = 0;
    let mut last_message_count: u64 = 0;

    loop {
        println!("🔄 Polling Fluxera service for new data...");

        let listener_guard = listener.lock().await;

        // Fetch chain data from Fluxera
        match listener_guard.fetch_chain_data().await {
            Ok(chain_data) => {
                println!(
                    "📊 Fetched data from chain {}: {} events, {} messages",
                    chain_data.chain_id,
                    chain_data.events.len(),
                    chain_data.messages.len()
                );

                // Check if we have new events
                let current_event_count = chain_data.summary
                    .as_ref()
                    .map(|s| s.total_events)
                    .unwrap_or(0);

                if current_event_count > last_event_count {
                    println!(
                        "🆕 New events detected: {} -> {}",
                        last_event_count, current_event_count
                    );

                    // Parse and store new events
                    for event in &chain_data.events {
                        match parser.parse_fluxera_event(event) {
                            Ok(normalized) => {
                                if let Err(e) = database.store_event(normalized).await {
                                    eprintln!("❌ Failed to store event: {}", e);
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse event: {}", e);
                            }
                        }
                    }

                    last_event_count = current_event_count;
                }

                // Check for new messages
                let current_message_count = chain_data.summary
                    .as_ref()
                    .map(|s| s.total_messages)
                    .unwrap_or(0);

                if current_message_count > last_message_count {
                    println!(
                        "🆕 New messages detected: {} -> {}",
                        last_message_count, current_message_count
                    );

                    // Parse and store new messages as events
                    for message in &chain_data.messages {
                        match parser.parse_fluxera_message(message) {
                            Ok(normalized) => {
                                if let Err(e) = database.store_event(normalized).await {
                                    eprintln!("❌ Failed to store message: {}", e);
                                }
                            }
                            Err(e) => {
                                eprintln!("❌ Failed to parse message: {}", e);
                            }
                        }
                    }

                    last_message_count = current_message_count;
                }

                if current_event_count == last_event_count
                    && current_message_count == last_message_count
                {
                    println!("💤 No new data, waiting...");
                }
            }
            Err(e) => {
                eprintln!("⚠️  Failed to fetch chain data: {}", e);
            }
        }

        drop(listener_guard);

        // Wait before next poll
        tokio::time::sleep(poll_interval).await;
    }
}