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

---

## 🐳 Quick Start (Docker)

**The easiest way to test Fluxera** - one command, everything runs:

```bash
# Clone the repository
git clone https://github.com/juliusjulyp/Fluxera.git
cd Fluxera

# Start everything with Docker Compose
docker compose up --force-recreate
```

This will:
1. Build a container with Rust + Linera CLI + Node.js
2. Start a local Linera network with faucet
3. Build and deploy the Fluxera WASM application
4. Launch the frontend dashboard

**Access the application:**
- **Frontend Dashboard:** http://localhost:5173
- **Linera Faucet:** http://localhost:8080
- **Validator Proxy:** http://localhost:9001

**What you can do:**
- View real-time blockchain statistics
- Connect a session wallet (auto-funded by faucet)
- Track custom analytics events on-chain
- Send cross-chain messages between microchains

**Stop everything:**
```bash
docker compose down
```

---

## 🧪 Manual Setup (Alternative)

Follow these steps to run and test the complete Fluxera stack locally:

### Prerequisites

- **Rust 1.75+** with Cargo installed
- **Node.js 18+** and npm
- **Linera CLI** installed (see [Linera installation guide](https://linera.dev/developers/getting_started/installation.html))

### Step 1: Start Linera Local Network

First, start a local Linera test network with a faucet:

```bash
# Start the local network (keeps running in the background)
linera net up --with-faucet --faucet-port 8081
```

This will:
- Initialize a local validator with default shard configuration
- Start a faucet service on port 8081
- Display environment variables (LINERA_WALLET, LINERA_KEYSTORE, LINERA_STORAGE)

**Note:** Keep this terminal running throughout your testing session.

### Step 2: Use Admin Wallet

In a **new terminal**, use the admin wallet created by the local network.

When you started `linera net up`, it displayed environment variables like this:

```bash
export LINERA_WALLET="/tmp/.tmp0K701O/wallet_0.json"
export LINERA_KEYSTORE="/tmp/.tmp0K701O/keystore_0.json"
export LINERA_STORAGE="rocksdb:/tmp/.tmp0K701O/client_0.db"
```

**Copy those exact export statements** from your terminal and paste them into this new terminal session.

Then verify your wallet:

```bash
# Verify your wallet setup
linera wallet show
```

You should see output showing your chain IDs (including the admin chain) and balances.

### Step 3: Start Linera GraphQL Service

Start the Linera GraphQL service that Fluxera will connect to:

```bash
# In a new terminal
linera service --port 8080
```

The GraphQL service will be available at **http://localhost:8080**

### Step 4: Build and Start Fluxera Backend

Build and run the Fluxera indexer:

```bash
# Navigate to the indexer directory
cd Fluxera/indexer-core

# Test the connection to Linera service
cargo run -- --test-connection --service-url http://localhost:8080

# Start the Fluxera indexer
cargo run --release -- --service-url http://localhost:8080
```

The indexer will:
- Initialize SQLite database
- Start REST API server on **http://localhost:3001**
- Enable WebSocket support for real-time updates

**Note:** Keep this terminal running.

### Step 5: Start Frontend Dashboard

In a **new terminal**, start the React/Next.js frontend:

```bash
# Navigate to frontend directory
cd Fluxera/frontend

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

The dashboard will be available at **http://localhost:3000**

### Step 6: Test the API Endpoints

Test that all API endpoints are working:

```bash
# Get API information
curl http://localhost:3001/

# Check service health
curl http://localhost:3001/health

# Get database statistics
curl http://localhost:3001/stats

# Get recent events
curl http://localhost:3001/events/recent

# Query events with filters
curl "http://localhost:3001/events?limit=10"
```

### Step 7: View the Dashboard

Open your browser and navigate to:

- **Frontend Dashboard:** http://localhost:3000
- **Backend API:** http://localhost:3001
- **Linera GraphQL:** http://localhost:8080
- **Faucet GraphQL:** http://localhost:8081

The dashboard will display:
- Connection status
- Real-time blockchain events
- Microchain statistics
- Event timeline and details

### Step 8: Generate Test Activity (Optional)

To see the indexer in action, create some blockchain activity:

```bash
# Check your balance
linera query-balance

# Deploy a test application (example: counter)
cd linera-protocol/examples/counter
cargo build --release --target wasm32-unknown-unknown

# Publish and create the application
linera publish-and-create \
  target/wasm32-unknown-unknown/release/counter_{contract,service}.wasm \
  --json-argument "0"
```

The Fluxera indexer will automatically detect and index these events.

### Running All Services (Summary)

Once set up, you'll have **4 terminals running**:

1. **Terminal 1:** Linera local network
   ```bash
   linera net up --with-faucet --faucet-port 8081
   ```

2. **Terminal 2:** Linera GraphQL service
   ```bash
   linera service --port 8080
   ```

3. **Terminal 3:** Fluxera backend indexer
   ```bash
   cd indexer-core && ./target/release/fluxera --service-url http://localhost:8080
   ```

4. **Terminal 4:** Frontend dashboard
   ```bash
   cd frontend && npm run dev
   ```

### Troubleshooting

**Issue: Wallet already exists**
```bash
rm -rf ~/.config/linera
linera wallet init --faucet http://localhost:8081
```

**Issue: Port already in use**
- Check if services are already running: `ps aux | grep -E "(linera|fluxera|next)"`
- Kill existing processes or use different ports

**Issue: Connection refused**
- Ensure Linera local network is running
- Verify services are on correct ports (8080, 8081, 3000, 3001)
- Check firewall settings

**Issue: Build errors**
- Update Rust: `rustup update`
- Clean build: `cargo clean && cargo build --release`

### Stopping All Services

To cleanly stop all services:

```bash
# Press Ctrl+C in each terminal, or:
pkill -f "linera net"
pkill -f "linera service"
pkill -f "fluxera"
pkill -f "next dev"
```

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
**Status: PARTIALLY COMPLETED**

**Goal:** Add cross-chain message tracking and real-time streaming - the core features developers need.

**Core Deliverables:**
- ⏳ **Cross-chain message indexing** - API structure ready, needs active microchains
- 🔄 **Real-time updates (Polling-based)** ✅ - Auto-refresh every 5-30 seconds implemented
- ✅ **Real-time push notifications** - Connection status and error notifications in frontend
- ⏳ **Application event filtering** - API endpoints ready, needs WebAssembly events
- ✅ **Enhanced database schema** - SQLite schema optimized with proper indexing
- ✅ **Testnet integration** - Full compatibility with Linera local & testnet networks
- ✅ **Frontend Integration** - Complete React dashboard with real-time data display
- ✅ **CORS Support** - Production-ready cross-origin request handling
- ✅ **TypeScript API Client** - Full type-safe frontend integration

**Tech Stack Implemented:**
- ✅ Enhanced `sqlx` schemas for cross-chain data
- ✅ `tower-http` for CORS and production middleware
- ✅ React hooks for real-time data management
- ✅ TypeScript interfaces for type safety
- 🔄 Polling-based real-time updates (WebSocket streaming planned for optimization)

**Success Metrics Achieved:**
- ✅ Query response time < 100ms for all endpoints
- ✅ Modular architecture supporting unlimited microchains 
- ✅ Real-time frontend updates with 5-30 second intervals
- ✅ Production-ready error handling and connection monitoring

**Ahead-of-Schedule Achievements:**
- 🚀 **Complete Frontend Dashboard** - Beautiful React UI (originally planned for Wave 4)
- 🚀 **Real-time Connection Monitoring** - Live status indicators and health checks
- 🚀 **Production-Ready CORS** - Cross-origin security handling
- 🚀 **TypeScript Integration** - Full type safety across the stack

### 🌊 Wave 3 — GraphQL API & Performance Optimization
**Goal:** Provide flexible querying capabilities and optimize for production performance.

**Core Deliverables:**
- **GraphQL API** - Flexible queries with `async-graphql`
- **Query optimization** - Database indexing and query planning
- **Caching layer** - Redis for frequently accessed data
- **Geographic performance monitoring** - Track microchain performance by region and validator response times
- **Data backup & recovery** - Reliable data persistence strategies
- **Performance monitoring** - Basic metrics and logging

**Architecture Addition:**
```
query-engine/
├── graphql/          // GraphQL schema and resolvers
├── cache/            // Redis caching layer
├── optimization/     // Query performance tools
└── geographic/       // Regional performance monitoring
```

**Success Metrics:**
- GraphQL API with <100ms query response time
- Support complex cross-microchain queries
- 50% improvement in query performance with caching
- Geographic latency tracking across all supported regions

### 🌊 Wave 4 — Wallet Integration & Cross-Chain UI
**Status: COMPLETED**

**Goal:** Full wallet integration and cross-chain interaction UI.

**Deliverables:**
- ✅ Multi-wallet support (CheCko, Croissant, Session)
- ✅ Session wallet via Conway testnet faucet
- ✅ Cross-chain message form with chain ID validation
- ✅ Event tracking form for custom on-chain events
- ✅ Authenticated queries through WASM client
- ✅ React hooks library (13+ hooks in `useFluxera.ts`)
- ✅ LineraProvider context for wallet state management

### 🌊 Wave 5 — Production Deployment & Testnet Polish
**Goal:** Deploy to production and resolve testnet integration issues.

**Core Deliverables:**
- ⏳ **CORS Resolution** - Work with Linera team on validator CORS headers
- ⏳ **Production Frontend** - Deploy to Vercel/Netlify
- ⏳ **Persistent Wallet Storage** - Remember wallet sessions across page reloads
- ⏳ **Enhanced Error UX** - Better error messages and recovery flows
- ⏳ **Mobile Responsiveness** - Optimize dashboard for mobile devices
- ⏳ **Documentation** - API docs and integration guides

**Known Issues to Address:**
- Conway validators lack CORS headers for browser WASM requests
- Session wallets are ephemeral (lost on page refresh)

### 🌊 Wave 6 — Advanced Analytics & Ecosystem
**Goal:** Advanced features and ecosystem integration.

**Core Deliverables:**
- ⏳ **Network Topology Visualizer** - Graph view of microchain connections
- ⏳ **Historical Analytics** - Time-range queries and trend analysis
- ⏳ **Alerts & Notifications** - Custom event alerts via webhook/email
- ⏳ **API Playground** - Interactive GraphQL explorer
- ⏳ **Multi-chain Dashboard** - Aggregate view across all user's chains
- ⏳ **Performance Monitoring** - Chain health scores and latency tracking

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

