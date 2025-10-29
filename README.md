# Fluxera - Linera Data Availability & Indexing Layer

## 🌟 Empowering the Next Generation of Scalable Web3 Applications

Fluxera is the comprehensive data infrastructure and indexing layer for [Linera](https://linera.io), the breakthrough blockchain protocol that achieves unlimited horizontal scaling through **microchains** - lightweight, parallel chains that enable instant finality (<0.5s) and unlimited throughput.

### The Problem We Solve

Traditional blockchains force all applications to compete for space on a single chain, creating bottlenecks and high fees. Linera revolutionizes this with microchains: each application can have its own dedicated chain(s) while sharing the same validator security. However, this creates a new challenge: **how do you track, index, and query data across thousands of parallel microchains running WebAssembly applications?**

### Our Solution

Fluxera is a high-performance, Rust-native indexing and data availability layer that:

- 🔍 **Tracks unlimited microchains** in real-time as they're created and destroyed
- ⚡ **Indexes WebAssembly application events** with sub-500ms latency (matching Linera's finality)
- 🌐 **Correlates cross-chain messages** between microchains and applications  
- 📊 **Provides unified querying** across the entire microchain network
- 🛡️ **Ensures data integrity** with cryptographic proofs and distributed storage
- 🔧 **Offers developer-friendly APIs** (REST, GraphQL, WebSocket) and multi-language SDKs

### Vision: The Data Layer for Infinite Scalability

As Linera enables applications to scale horizontally by creating new microchains on-demand, Fluxera ensures that this distributed data remains discoverable, queryable, and verifiable. We're building the data infrastructure that will power the next generation of Web3 applications - from DeFi protocols that spawn microchains per user, to gaming platforms with dedicated chains per match, to social networks with personal microchains for each user.

**Today:** Index events from testnet microchains  
**Tomorrow:** Power real-time analytics across millions of parallel applications  
**Future:** Enable AI-driven insights and cross-application intelligence in the Linera ecosystem

## Overview

Fluxera connects to Linera microchain networks via GraphQL, indexes blockchain events in real-time, and provides a REST API for querying the indexed data. It's designed to be lightweight, fast, and easy to deploy.

## Features

- **Real-time indexing** of Linera microchain events
- **GraphQL integration** with Linera services
- **SQLite database** for efficient local storage
- **REST API** for querying indexed data
- **Event normalization** for consistent data structures
- **Connection testing** and health monitoring



## 🚀 Development Roadmap

Fluxera follows a practical 5-wave development approach, building from MVP to production-grade infrastructure:

### 🌊 Wave 1 — MVP Indexer ✅
**Status: COMPLETED**

**Goal:** Basic Linera microchain indexer with REST API for testing and initial development.

**Deliverables:**
- ✅ Linera GraphQL client integration (`listener.rs`)
- ✅ Event parser and normalizer (`parser.rs`) 
- ✅ SQLite storage layer (`storage.rs`)
- ✅ REST API with Axum (`api.rs`)
- ✅ CLI for configuration and testing

**Success Metrics:**
- ✅ Successfully indexes Linera microchain events
- ✅ Query response time < 100ms for basic endpoints
- ✅ Modular codebase with clean separation

### 🌊 Wave 2 — Cross-Chain Messaging & Real-Time Updates
**Goal:** Add cross-chain message tracking and real-time streaming - the core features developers need.

**Core Deliverables:**
- **Cross-chain message indexing** - Track messages between microchains
- **WebSocket streaming** - Real-time event notifications for dApps
- **Application event filtering** - Filter by WebAssembly application type
- **Enhanced database schema** - Optimized for cross-chain queries
- **Testnet integration** - Full compatibility with current Linera testnet

**Tech Stack:**
- `tokio-tungstenite` for WebSocket streaming
- Enhanced `sqlx` schemas for cross-chain data
- Application-aware event parsing

**Success Metrics:**
- Cross-chain message latency < 500ms
- Support 100+ active microchains
- Real-time WebSocket connections for live updates

### 🌊 Wave 3 — GraphQL API & Performance Optimization
**Goal:** Provide flexible querying capabilities and optimize for production performance.

**Core Deliverables:**
- **GraphQL API** - Flexible queries with `async-graphql`
- **Query optimization** - Database indexing and query planning
- **Caching layer** - Redis for frequently accessed data
- **Data backup & recovery** - Reliable data persistence strategies
- **Performance monitoring** - Basic metrics and logging

**Architecture Addition:**
```
query-engine/
├── graphql/          // GraphQL schema and resolvers
├── cache/            // Redis caching layer
└── optimization/     // Query performance tools
```

**Success Metrics:**
- GraphQL API with <100ms query response time
- Support complex cross-microchain queries
- 50% improvement in query performance with caching

### 🌊 Wave 4 — Developer Experience & SDKs
**Goal:** Make integration easy with SDKs and developer tools.

**Core Deliverables:**
- **TypeScript SDK** - Easy frontend integration
- **Rust client library** - Native Rust applications
- **Developer documentation** - Comprehensive guides and examples
- **API versioning** - Stable API contracts for production use
- **Developer dashboard** - Web UI for exploring indexed data

**SDK Features:**
```
sdk/
├── typescript/       // Web/Node.js client
├── rust/            // Native Rust client
└── examples/        // Integration examples
```

**Success Metrics:**
- TypeScript SDK adoption in 5+ projects
- Comprehensive API documentation
- Developer dashboard for data exploration

### 🌊 Wave 5 — Production Infrastructure & Reliability
**Goal:** Production-ready deployment with monitoring, high availability, and ecosystem integration.

**Core Deliverables:**
- **High availability** - Multi-instance deployment with load balancing
- **Comprehensive monitoring** - Prometheus metrics and Grafana dashboards
- **Automated deployment** - Docker containers and CI/CD pipelines
- **Error handling & recovery** - Robust failure scenarios and auto-recovery
- **Ecosystem integration** - Compatibility with Linera tooling and services

**Infrastructure:**
- **Monitoring:** Prometheus + Grafana for observability
- **Deployment:** Docker + Kubernetes for scaling
- **CI/CD:** GitHub Actions for automated testing and deployment

**Success Metrics:**
- 99.5% uptime with automated failover
- Handle 1,000+ microchains with <1s query latency
- Production adoption by Linera ecosystem projects

---



## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Linera Node   │    │    Fluxera      │    │   REST API      │
│   (GraphQL)     │◄──►│    Indexer      │◄──►│   Consumers     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │ SQLite Database │
                       └─────────────────┘
```

## Components

### Core Modules

1. **Listener** (`src/listener.rs`)
   - Connects to Linera GraphQL services
   - Discovers and tracks microchains
   - Fetches real-time events

2. **Parser** (`src/parser.rs`)
   - Normalizes raw Linera events
   - Structures data for database storage
   - Handles different event types

3. **Storage** (`src/storage.rs`)
   - SQLite database management
   - Event storage and retrieval
   - Query optimization with indexes

4. **API** (`src/api.rs`)
   - REST API server using Axum
   - Event querying endpoints
   - Health and statistics monitoring

## Quick Start

### Prerequisites

- Rust 1.75+ with Cargo
- A running Linera service (local or testnet)

### Installation

1. Clone and build:
```bash
cd Fluxera/indexer-core
cargo build --release
```

2. Test connection to Linera service:
```bash
cargo run -- --test-connection --service-url http://localhost:8080
```

3. Start full indexer:
```bash
cargo run -- --service-url http://localhost:8080
```

### Configuration

#### Linera Service Setup

**Local Development:**
```bash
# Start local Linera service
linera service --port 8080
```

**Testnet Connection:**
```bash
# Connect to testnet (replace with actual testnet URL)
cargo run -- --service-url https://testnet.linera.net
```

## API Endpoints

Once running, the REST API is available at `http://localhost:3000`:

### Core Endpoints

- `GET /` - API information and available endpoints
- `GET /health` - Service health check and database status
- `GET /stats` - Database statistics (total events, chains, etc.)

### Data Query Endpoints

- `GET /events` - Query events with optional filters
  - `?microchain_id=<chain_id>` - Filter by microchain
  - `?start_height=<num>&end_height=<num>` - Filter by block height range
  - `?limit=<num>` - Limit number of results

- `GET /events/recent` - Get most recent events
- `GET /events/microchain/<chain_id>` - Get events for specific microchain
- `GET /events/height/<start>/<end>` - Get events in block height range

### Example API Usage

```bash
# Get API information
curl http://localhost:3000/

# Check service health
curl http://localhost:3000/health

# Get database statistics
curl http://localhost:3000/stats

# Get recent events
curl http://localhost:3000/events/recent

# Get events for specific microchain
curl http://localhost:3000/events/microchain/your-chain-id

# Get events in block range
curl http://localhost:3000/events/height/100/200
```

## Development

### Project Structure

```
indexer-core/
├── src/
│   ├── main.rs      # CLI interface and main application
│   ├── lib.rs       # Library exports
│   ├── listener.rs  # Linera GraphQL client
│   ├── parser.rs    # Event normalization
│   ├── storage.rs   # Database operations
│   └── api.rs       # REST API server
├── Cargo.toml       # Dependencies and configuration
└── README.md        # This file
```

### Key Dependencies

- **tokio** - Async runtime
- **linera-client/sdk/base** - Linera integration
- **axum** - Web framework for REST API
- **sqlx** - Database operations
- **serde** - Serialization
- **anyhow** - Error handling
- **reqwest** - HTTP client for GraphQL

### Building

```bash
# Development build
cargo build

# Release build (optimized)
cargo build --release

# Run tests
cargo test

# Check code formatting
cargo fmt --check

# Run clippy linter
cargo clippy
```

## Database Schema

The indexer uses SQLite with the following main table:

```sql
CREATE TABLE events (
    id TEXT PRIMARY KEY,              -- Unique event identifier
    event_type TEXT NOT NULL,         -- Type: Transaction, ContractEvent, etc.
    block_height INTEGER NOT NULL,    -- Block height where event occurred
    microchain_id TEXT NOT NULL,      -- Linera microchain identifier
    timestamp INTEGER NOT NULL,       -- Event timestamp (microseconds)
    transaction_data TEXT,            -- JSON: Transaction details (if applicable)
    contract_event_data TEXT,         -- JSON: Contract event data (if applicable)
    state_change_data TEXT,           -- JSON: State change data (if applicable)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

Indexes are created on `block_height`, `microchain_id`, and `timestamp` for efficient querying.

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure Linera service is running and accessible
   - Check the GraphQL endpoint URL
   - Verify network connectivity

2. **No Events Found**
   - Microchain may have no activity
   - Check if chain ID is correct
   - Verify the chain is tracked: manually add with `add_chain_to_track()`

3. **Database Errors**
   - Ensure write permissions in the working directory
   - Check disk space for SQLite database growth

### Debugging

Enable verbose logging:
```bash
RUST_LOG=debug cargo run -- --service-url http://localhost:8080
```

### Testing Connection

Use the test mode to verify Linera connectivity:
```bash
cargo run -- --test-connection --service-url http://localhost:8080
```

### 🧠 Linera-Specific Innovations

**Microchain-Native Architecture:**
- **Unlimited Horizontal Scaling:** Design scales with Linera's unlimited microchain creation
- **WebAssembly-First Indexing:** Native support for Wasm application event schemas and state changes
- **Cross-chain Message Intelligence:** Advanced correlation of asynchronous inter-microchain communication
- **Ownership-Aware Processing:** Different indexing strategies for single-owner, multi-owner, and public microchains
- **Sub-Finality Latency:** Data availability faster than Linera's already-fast <0.5s finality

**Ecosystem Integration:**
- **Developer Wallet Synergy:** Direct integration with Linera wallet clients for enhanced data access
- **Testnet-to-Mainnet Evolution:** Built for current testnet with mainnet scalability in mind
- **Wasm Runtime Integration:** `wasmtime` integration for application introspection and event prediction
- **The Graph Protocol Bridge:** Potential integration for broader Web3 ecosystem connectivity

**Unique Value Propositions:**
- **Infinite Scale Readiness:** Architecture designed for millions of parallel microchains
- **Application Intelligence:** Understanding Wasm application patterns and cross-app interactions
- **Dynamic Schema Evolution:** Automatically adapt to new Wasm application types and event schemas
- **Microchain Lifecycle Tracking:** Index microchain creation, evolution, and destruction events

**Future Innovations:**
- **ZK-Powered Data Integrity:** Using `halo2` for cryptographic proofs of indexed data correctness
- **Cross-Application Analytics:** AI-driven insights across the entire Linera application ecosystem
- **Predictive Microchain Spawning:** ML models to predict optimal microchain creation patterns
- **Decentralized Indexer Network:** Distributed indexing across multiple nodes with economic incentives

