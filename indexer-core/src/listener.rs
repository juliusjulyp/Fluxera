use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Fluxera event from the smart contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FluxeraEvent {
    #[serde(rename = "eventId")]
    pub event_id: String,
    #[serde(rename = "eventType")]
    pub event_type: String,
    pub owner: String,
    pub timestamp: String,
    pub data: String,
    #[serde(rename = "chainId")]
    pub chain_id: String,
}

/// Fluxera cross-chain message from the smart contract
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FluxeraMessage {
    #[serde(rename = "messageId")]
    pub message_id: String,
    #[serde(rename = "sourceChain")]
    pub source_chain: String,
    #[serde(rename = "targetChain")]
    pub target_chain: String,
    #[serde(rename = "messageType")]
    pub message_type: String,
    #[serde(rename = "sentAt")]
    pub sent_at: String,
    pub payload: String,
    pub status: Option<String>,
    #[serde(rename = "deliveredAt")]
    pub delivered_at: Option<String>,
}

/// Fluxera analytics summary
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FluxeraSummary {
    #[serde(rename = "totalEvents")]
    pub total_events: u64,
    #[serde(rename = "totalMessages")]
    pub total_messages: u64,
    #[serde(rename = "uniqueUsers")]
    pub unique_users: u64,
    #[serde(rename = "chainId")]
    pub chain_id: String,
}

/// Combined data fetched from a chain
#[derive(Debug, Clone)]
pub struct ChainData {
    pub chain_id: String,
    pub events: Vec<FluxeraEvent>,
    pub messages: Vec<FluxeraMessage>,
    pub summary: Option<FluxeraSummary>,
}

/// Handles connection to Linera/Fluxera service via GraphQL API
pub struct LineraListener {
    graphql_client: reqwest::Client,
    service_url: String,
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
        })
    }

    /// Test connection to Linera GraphQL service
    pub async fn health_check(&self) -> Result<bool> {
        println!("🧪 Testing connection to Linera service...");

        let query = r#"{ __typename }"#;

        match self.execute_graphql_query(query).await {
            Ok(_) => {
                println!("✅ GraphQL service is responsive");
                Ok(true)
            }
            Err(e) => {
                println!("⚠️  GraphQL service error: {}", e);
                Ok(false)
            }
        }
    }

    /// Discover available chains via GraphQL
    pub async fn discover_chains(&mut self) -> Result<()> {
        println!("🔍 Discovering Fluxera service capabilities...");

        // Try to get analytics summary to verify Fluxera is running
        match self.fetch_chain_data().await {
            Ok(data) => {
                println!("✅ Fluxera service discovered on chain: {}", data.chain_id);
                println!("   Total events: {}", data.summary.as_ref().map(|s| s.total_events).unwrap_or(0));
                println!("   Total messages: {}", data.summary.as_ref().map(|s| s.total_messages).unwrap_or(0));
            }
            Err(e) => {
                println!("⚠️  Could not fetch Fluxera data: {}", e);
            }
        }

        Ok(())
    }

    /// Execute a GraphQL query against the Linera service
    async fn execute_graphql_query(&self, query: &str) -> Result<serde_json::Value> {
        let request_body = serde_json::json!({ "query": query });

        let response = self
            .graphql_client
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

        if let Some(errors) = response_data.get("errors") {
            return Err(anyhow::anyhow!("GraphQL errors: {}", errors));
        }

        Ok(response_data["data"].clone())
    }

    /// Fetch all Fluxera data from the smart contract via GraphQL
    pub async fn fetch_chain_data(&self) -> Result<ChainData> {
        println!("📊 Fetching Fluxera data from service...");

        // Query analytics summary
        let summary_query = r#"
        {
            analyticsSummary {
                totalEvents
                totalMessages
                uniqueUsers
                chainId
            }
        }
        "#;

        let summary = match self.execute_graphql_query(summary_query).await {
            Ok(data) => {
                if let Some(s) = data.get("analyticsSummary") {
                    Some(FluxeraSummary {
                        total_events: s.get("totalEvents").and_then(|v| v.as_u64()).unwrap_or(0),
                        total_messages: s.get("totalMessages").and_then(|v| v.as_u64()).unwrap_or(0),
                        unique_users: s.get("uniqueUsers").and_then(|v| v.as_u64()).unwrap_or(0),
                        chain_id: s.get("chainId").and_then(|v| v.as_str()).unwrap_or("unknown").to_string(),
                    })
                } else {
                    None
                }
            }
            Err(e) => {
                println!("⚠️  Failed to fetch summary: {}", e);
                None
            }
        };

        let chain_id = summary.as_ref().map(|s| s.chain_id.clone()).unwrap_or_else(|| "unknown".to_string());

        // Query recent events
        let events_query = r#"
        {
            recentEvents(limit: 50) {
                eventId
                eventType
                owner
                timestamp
                data
                chainId
            }
        }
        "#;

        let events = match self.execute_graphql_query(events_query).await {
            Ok(data) => {
                if let Some(arr) = data.get("recentEvents").and_then(|v| v.as_array()) {
                    arr.iter()
                        .filter_map(|e| {
                            Some(FluxeraEvent {
                                event_id: e.get("eventId")?.as_str()?.to_string(),
                                event_type: e.get("eventType")?.as_str()?.to_string(),
                                owner: e.get("owner")?.as_str()?.to_string(),
                                timestamp: e.get("timestamp")?.as_str()?.to_string(),
                                data: e.get("data")?.as_str()?.to_string(),
                                chain_id: e.get("chainId")?.as_str()?.to_string(),
                            })
                        })
                        .collect()
                } else {
                    Vec::new()
                }
            }
            Err(e) => {
                println!("⚠️  Failed to fetch events: {}", e);
                Vec::new()
            }
        };

        // Query recent messages with status
        let messages_query = r#"
        {
            messagesWithStatus(limit: 50) {
                messageId
                sourceChain
                targetChain
                messageType
                sentAt
                payload
                status
                deliveredAt
            }
        }
        "#;

        let messages = match self.execute_graphql_query(messages_query).await {
            Ok(data) => {
                if let Some(arr) = data.get("messagesWithStatus").and_then(|v| v.as_array()) {
                    arr.iter()
                        .filter_map(|m| {
                            Some(FluxeraMessage {
                                message_id: m.get("messageId")?.as_str()?.to_string(),
                                source_chain: m.get("sourceChain")?.as_str()?.to_string(),
                                target_chain: m.get("targetChain")?.as_str()?.to_string(),
                                message_type: m.get("messageType")?.as_str()?.to_string(),
                                sent_at: m.get("sentAt")?.as_str()?.to_string(),
                                payload: m.get("payload")?.as_str()?.to_string(),
                                status: m.get("status").and_then(|v| v.as_str()).map(|s| s.to_string()),
                                delivered_at: m.get("deliveredAt").and_then(|v| v.as_str()).map(|s| s.to_string()),
                            })
                        })
                        .collect()
                } else {
                    Vec::new()
                }
            }
            Err(e) => {
                println!("⚠️  Failed to fetch messages: {}", e);
                Vec::new()
            }
        };

        println!(
            "✅ Fetched {} events and {} messages from chain {}",
            events.len(),
            messages.len(),
            chain_id
        );

        Ok(ChainData {
            chain_id,
            events,
            messages,
            summary,
        })
    }
}
