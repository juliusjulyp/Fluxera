use anyhow::Result;
use serde::{Deserialize, Serialize};
use linera_base::{
    crypto::CryptoHash,
    data_types::{BlockHeight, Timestamp},
    identifiers::{ChainId, ApplicationId},
};
use reqwest;
use std::collections::HashMap;
use std::time::Duration;

///  Linera event data using native types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawLineraEvent {
    pub event_type: LineraEventType,
    pub chain_id: ChainId,
    pub block_height: BlockHeight,
    pub timestamp: Timestamp,
    pub transaction_data: Option<LineraTransactionData>,
    pub block_data: Option<LineraBlockData>,
    pub application_data: Option<LineraApplicationData>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum LineraEventType {
    BlockProposal,
    BlockConfirmation, 
    Transaction,
    ApplicationCall,
    CrossChainMessage,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineraTransactionData {
    pub hash: CryptoHash,
    pub authenticated_signer: Option<String>,
    pub operations: Vec<String>, // Simplified for now
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineraBlockData {
    pub hash: CryptoHash,
    pub previous_block_hash: Option<CryptoHash>,
    pub height: BlockHeight,
    pub timestamp: Timestamp,
    pub transaction_count: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LineraApplicationData {
    pub application_id: ApplicationId,
    pub operation: String,
    pub argument: Vec<u8>, // BCS encoded data
}

/// Handles connection to Linera nodes via GraphQL API
pub struct LineraListener {
    graphql_client: reqwest::Client,
    service_url: String, // Linera service GraphQL endpoint
    chains_to_track: Vec<ChainId>,
    last_processed_heights: HashMap<ChainId, BlockHeight>,
}


impl LineraListener {
    /// Create a new listener for Linera service
    pub async fn new(service_url: &str) -> Result<Self> {
        println!("🔗 Initializing Linera GraphQL client for: {}", service_url);
        
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?;
        
        Ok(Self {
            graphql_client: client,
            service_url: service_url.to_string(),
            chains_to_track: Vec::new(),
            last_processed_heights: HashMap::new(),
        })
    }
    
    /// Test connection to Linera GraphQL service
    pub async fn health_check(&self) -> Result<bool> {
        println!("🧪 Testing connection to Linera service...");
        
        // Test with a basic GraphQL query
        let query = r#"
        {
            __typename
        }
        "#;
        
        match self.execute_graphql_query(query).await {
            Ok(response) => {
                println!("✅ GraphQL service responded: {:?}", response);
                Ok(true)
            },
            Err(e) => {
                println!("⚠️  GraphQL service error: {}", e);
                Ok(false)
            }
        }
    }
    
    /// Discover available chains via GraphQL
    pub async fn discover_chains(&mut self) -> Result<()> {
        println!("🔍 Discovering available microchains...");

        // Try to query the GraphQL schema to understand available queries
        let query = r#"
        {
            __schema {
                queryType {
                    fields {
                        name
                        description
                    }
                }
            }
        }
        "#;

        match self.execute_graphql_query(query).await {
            Ok(response) => {
                println!("📊 GraphQL schema introspection response: {:?}", response);
                println!("ℹ️  Linera chains need to be added manually via add_chain_to_track()");
                println!("   - Use 'linera wallet show' to get your chain IDs");
                println!("   - Or initialize with faucet: https://faucet.testnet-babbage.linera.net");
                println!("✅ GraphQL service is responsive. {} chains currently tracked", self.chains_to_track.len());
            }
            Err(e) => {
                println!("⚠️  Schema introspection failed: {}", e);
                println!("   This may be normal - Linera service might not support introspection");
                println!("   Chains can still be added manually via add_chain_to_track()");
            }
        }

        Ok(())
    }
    
    /// Execute a GraphQL query against the Linera service
    async fn execute_graphql_query(&self, query: &str) -> Result<serde_json::Value> {
        let request_body = serde_json::json!({
            "query": query
        });
        
        let response = self.graphql_client
            .post(&self.service_url)
            .header("Content-Type", "application/json")
            .json(&request_body)
            .send()
            .await?;
        
        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "GraphQL request failed with status: {}", 
                response.status()
            ));
        }
        
        let response_data: serde_json::Value = response.json().await?;
        
        // Check for GraphQL errors
        if let Some(errors) = response_data.get("errors") {
            return Err(anyhow::anyhow!(
                "GraphQL errors: {}", 
                errors
            ));
        }
        
        Ok(response_data["data"].clone())
    }
    
    
    /// Fetch the latest block from a specific chain via GraphQL
    pub async fn fetch_chain_tip(&self, chain_id: &ChainId) -> Result<RawLineraEvent> {
        println!("🔍 Fetching latest data for chain: {}", chain_id);

        // First, try to get basic chain information through the applications query
        let query = format!(r#"
        {{
            applications(chainId: "{}") {{
                id
                link
            }}
        }}
        "#, chain_id);

        match self.execute_graphql_query(&query).await {
            Ok(response) => {
                println!("📊 Chain applications response: {:?}", response);

                // For now, create a basic event indicating we found the chain
                return Ok(RawLineraEvent {
                    event_type: LineraEventType::BlockConfirmation,
                    chain_id: *chain_id,
                    block_height: BlockHeight(0), // Will be updated from actual block data
                    timestamp: Timestamp::now(),
                    transaction_data: None,
                    block_data: Some(LineraBlockData {
                        hash: CryptoHash::try_from([0u8; 32].as_slice()).unwrap(), // Placeholder - needs actual data
                        previous_block_hash: None,
                        height: BlockHeight(0),
                        timestamp: Timestamp::now(),
                        transaction_count: 0,
                    }),
                    application_data: None,
                });
            }
            Err(e) => {
                println!("⚠️  Failed to query chain applications: {}", e);
                println!("   This chain may not exist or the service may be unavailable");
                Err(e)
            }
        }
    }
    
    /// Listen for the next event from tracked chains
    pub async fn next_event(&mut self) -> Result<RawLineraEvent> {
        if self.chains_to_track.is_empty() {
            return Err(anyhow::anyhow!("No chains to track. Call discover_chains() first."));
        }
        
        // For now, cycle through tracked chains and fetch their tips
        for chain_id in &self.chains_to_track {
            match self.fetch_chain_tip(chain_id).await {
                Ok(event) => {
                    // Update our tracking
                    self.last_processed_heights.insert(*chain_id, event.block_height);
                    return Ok(event);
                }
                Err(e) => {
                    println!("⚠️  Failed to fetch from chain {}: {}", chain_id, e);
                    continue;
                }
            }
        }
        
        // If all chains failed, wait and try again
        tokio::time::sleep(Duration::from_secs(5)).await;
        Err(anyhow::anyhow!("Failed to fetch events from any tracked chains"))
    }
    
}