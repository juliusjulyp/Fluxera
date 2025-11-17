use anyhow::Result;
use tokio;
use clap::{Arg, Command};

mod listener;
mod parser;
mod storage;
mod api;

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
    let parser = EventParser::new();
    let api_server = RestServer::new(database.clone());
    
    println!("✅ All components initialized successfully");
    
    // Start API server - run it synchronously to see any errors
    println!("🔄 Starting API server...");
    api_server.start("0.0.0.0:3001").await?;
    
    // This won't be reached since the server runs indefinitely
    Ok(())
}