# Fluxera - Linera Data Availability & Indexing Layer

## 📋 Latest Updates (Wave 6 Complete)

**Wave 6 Completed:**
- ✅ **Real-Time WebSocket Events** - Live streaming updates
- ✅ **Multi-Chain Setup** - 3 chains with Fluxera deployed
- ✅ **Cross-Chain Messaging** - True multi-chain message delivery with status tracking
- ✅ **Chain Selector UI** - Dropdown to select target chains
- ✅ **Message Status Tracking** - Sent → Delivered status with acknowledgments


---

## 🌟 What is Fluxera?

Fluxera is a high-performance data infrastructure and indexing layer for [Linera](https://linera.io), the blockchain protocol that achieves unlimited horizontal scaling through **microchains** - lightweight, parallel chains that enable instant finality and unlimited throughput.

### The Problem We Solve

Traditional blockchains force all applications to compete for space on a single chain, creating bottlenecks and high fees. Linera revolutionizes this with microchains, but creates a new challenge: **how do you track, index, and query data across thousands of parallel microchains?**

### Our Solution

Fluxera is a high-performance, Rust-native indexing and data availability layer that:

- 🔍 **Tracks unlimited microchains** in real-time as they're created and destroyed
- ⚡ **Indexes WebAssembly application events** with sub-500ms latency
- 🌐 **Correlates cross-chain messages** between microchains and applications
- 📊 **Provides unified querying** across the entire microchain network
- 🔧 **Wallet support** (CheCko, Croissant - coming soon)

---

## 🚀 Quick Start (Docker - Recommended)

**One command to run everything:**

```bash
git clone https://github.com/juliusjulyp/Fluxera.git
cd Fluxera
docker compose up --force-recreate
```

**Wait for startup (~2-3 minutes)**, then access:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | Dashboard UI |
| **Faucet** | http://localhost:8080 | Wallet funding & GraphiQL |
| **Linera Service** | http://localhost:8081 | GraphQL API |

**What you can do:**
- View real-time blockchain statistics
- Track custom analytics events (no wallet needed in local mode)
- Send cross-chain messages between microchains
- Works in local mode without wallet connection

**Stop everything:**
```bash
docker compose down
```

---

## 🚀 Development Roadmap

### 🌊 Wave 1 — MVP Indexer ✅
- ✅ Linera GraphQL client integration
- ✅ Event parser and normalizer
- ✅ SQLite storage layer
- ✅ REST API with Axum

### 🌊 Wave 2 — Cross-Chain Messaging ✅
- ✅ Real-time polling updates
- ✅ Frontend dashboard
- ✅ CORS support
- ✅ TypeScript API client

### 🌊 Wave 3 — Performance Planning ✅
- ✅ GraphQL API design
- ✅ Caching layer architecture
- ✅ Query optimization strategies

### 🌊 Wave 4 — Wallet Integration ✅
- ✅ Wallet integration framework (CheCko, Croissant support planned)
- ✅ Cross-chain message form
- ✅ Event tracking form
- ✅ React hooks library (13+ hooks)

### 🌊 Wave 5 — Docker & Testing ✅
- ✅ Docker Compose deployment
- ✅ Local Testing Mode
- ✅ Dynamic network detection
- ✅ Comprehensive build script

### 🌊 Wave 6 — Multi-Chain & Live Indexing ✅
- ✅ Real-Time WebSocket Events
- ✅ Multi-Chain Docker Setup (3 chains)
- ✅ Cross-Chain Message Delivery
- ✅ Message Status Tracking (Sent → Delivered)
- ✅ Chain Selector UI Component
- ✅ Delivery Acknowledgment System
- ✅ GraphQL API for Indexer (<100ms response time)

### 🔮 Future Developments

- ⏳ Network Topology Visualizer
- ⏳ Historical Analytics & Charts
- ⏳ Performance Monitoring Dashboard
- ⏳ Redis Caching Layer
- ⏳ Geographic Latency Tracking
- ⏳ Conway testnet redeployment
- ⏳ Live frontend configuration

---


## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Linera SDK 0.15.8 |
| **Backend** | Rust, Tokio, Axum, SQLite |
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS |
| **Wallet** | Linera Client SDK (CheCko, Croissant - coming soon) |
| **Infrastructure** | Docker, Docker Compose |

---

## 📡 API Reference

The Fluxera WASM application exposes a GraphQL API via the Linera service.

### Queries

```graphql
# Get analytics summary
query {
  analyticsSummary {
    totalEvents
    totalMessages
    uniqueUsers
    chainId
  }
}

# Get recent events
query {
  recentEvents(limit: 10) {
    eventId
    eventType
    owner
    timestamp
    data
    chainId
  }
}

# Get chain metrics
query {
  chainMetrics(chainId: "your-chain-id") {
    totalEvents
    uniqueUsers
    lastActivity
  }
}
```

### Mutations

```graphql
# Track an event
mutation {
  trackEvent(eventType: "user_action", data: "{\"key\": \"value\"}")
}

# Send cross-chain message
mutation {
  sendCrossChainMessage(
    targetChain: "target-chain-id"
    messageType: "analytics_sync"
    payload: "{\"data\": \"value\"}"
  )
}
```

---

## 🧪 Manual Setup (Alternative)

<details>
<summary>Click to expand manual setup instructions</summary>

### Prerequisites

- Rust 1.86+ with `wasm32-unknown-unknown` target
- Node.js 18+ with pnpm
- Linera CLI v0.15.8

### Step 1: Start Linera Network

```bash
# Terminal 1: Start local network with faucet
linera net up --with-faucet

# Copy the exported environment variables shown
export LINERA_WALLET="..."
export LINERA_KEYSTORE="..."
export LINERA_STORAGE="..."
```

### Step 2: Initialize Wallet

```bash
# Terminal 2: Initialize wallet
linera wallet init --faucet http://localhost:8080
linera wallet show
```

### Step 3: Build & Deploy WASM App

```bash
cd fluxera-app
cargo build --release --target wasm32-unknown-unknown

cd ..
linera publish-and-create \
  fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_contract.wasm \
  fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_service.wasm
```

### Step 4: Start Linera Service

```bash
# Terminal 3: Start GraphQL service
linera service --port 8081
```

### Step 5: Start Frontend

```bash
# Terminal 4: Start frontend
cd frontend
pnpm install
pnpm dev
```

Access the dashboard at http://localhost:5173

</details>

---

## 🔧 Troubleshooting

### Docker Issues

**Port already in use:**
```bash
docker compose down
lsof -i :5173  # Find process
kill -9 <PID>  # Kill it
```

**Rebuild from scratch:**
```bash
docker compose down -v
docker compose build --no-cache
docker compose up --force-recreate
```

### Build Issues

**Rust compilation fails:**
```bash
rustup update
rustup target add wasm32-unknown-unknown
cargo clean && cargo build --release
```

**Frontend issues:**
```bash
cd frontend
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Connection Issues

- Verify services are running: `docker compose ps`
- Check logs: `docker compose logs -f`
- Ensure ports 5173, 8080, 8081 are not blocked

---

## 📝 Changelog

### Wave 6 — Multi-Chain & Live Indexing (January 2026)
- ✅ Real-Time WebSocket Events
- ✅ Multi-Chain Docker Setup (3 chains with Fluxera)
- ✅ Cross-Chain Message Delivery with Acknowledgments
- ✅ Message Status Tracking (Sent → Delivered)
- ✅ Chain Selector UI Component
- ✅ `useMessageStatus` and `useMessagesWithStatus` hooks

### Wave 5 (January 2026)
- ✅ Docker Compose deployment
- ✅ Local Testing Mode
- ✅ Dynamic network detection

### Wave 4 (December 2025)
- ✅ Wallet integration framework
- ✅ React hooks library

### Wave 3 (November 2025)
- ✅ Performance planning
- ✅ GraphQL API design

### Wave 2 (November 2025)
- ✅ Frontend dashboard
- ✅ Real-time polling

### Wave 1 (October 2025)
- ✅ MVP indexer
- ✅ REST API

---

## 👥 Team

**Fluxera Team**
- GitHub: [@juliusjulyp](https://github.com/juliusjulyp)

---

## 📄 License

MIT License
