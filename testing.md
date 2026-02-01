# Fluxera Testing Guide

## Quick Test (Docker - Recommended)

### Step 1: Build and Start
```bash
cd /home/julypjulius/Fluxera
docker compose up --force-recreate
```

### Step 2: Wait for Services (~2-3 minutes)
Watch the logs for these milestones:
- `[1/7] Starting Linera local network with faucet...`
- `[2/7] Initializing wallet and creating 3 chains...`
- `[3/7] Building Fluxera WASM application...`
- `[4/7] Deploying Fluxera to primary chain...`
- `[5/7] Requesting Fluxera application on additional chains...`
- `[6/7] Starting Linera service on port 8081...`
- `[7/7] Starting frontend on port 5173...`
- `MULTI-CHAIN SETUP COMPLETE` - All 3 chains ready!
- `Ready in Xs` - Frontend is ready!

### Step 3: Verify Services
| Service | URL | Expected |
|---------|-----|----------|
| Frontend | http://localhost:5173 | Fluxera Dashboard loads |
| Faucet | http://localhost:8080 | GraphiQL IDE |
| Linera Service | http://localhost:8081 | GraphiQL IDE |
| Validator Proxy | http://localhost:9001 | Connection available |

### Step 4: Test Features

#### A. View Dashboard (No wallet needed)
1. Open http://localhost:5173
2. Verify "Local Network" appears 
3. Check stats cards are loading
4. Verify "Local Testing Mode" indicator shows on forms

#### B. Track an Event
1. Scroll to "Track New Event" form
2. Enter Event Type: `test_event`
3. Enter Custom Data: `{"message": "hello world"}`
4. Click "Track Event on Blockchain"
5. Event should appear in Recent Events table

#### C. Send Cross-Chain Message (Wave 6 Enhanced)
1. Scroll to "Send Cross-Chain Message" form
2. Use the new **Chain Selector dropdown** to select target chain
   - Shows all 3 configured chains
   - Your current chain is excluded from selection
   - Or click "Enter custom chain ID" for manual entry
3. Select message type (e.g., "Analytics Sync")
4. Enter payload: `{"test": "data"}`
5. Click "Send Cross-Chain Message"
6. Success notification should appear with message ID
7. Check **Message Tracer** to see status update (Sent → Delivered)

### Step 5: Stop Services
```bash
cd /home/julypjulius/Fluxera
docker compose down
```

---

## Manual Verification Commands

```bash
# Check frontend is serving
curl -s http://localhost:5173 | grep -o "Fluxera"

# Check local mode is detected
curl -s http://localhost:5173 | grep -o "Local Network"

# Check faucet is running
curl -s http://localhost:8080 | head -5

# Check Linera service
curl -s http://localhost:8081 | head -5

# View container logs
docker compose logs -f

# View specific service logs
docker compose logs app
```

---

## Troubleshooting

### Issue: Port already in use
```bash
# Find and kill process on port
sudo lsof -i :5173
sudo kill -9 <PID>

# Or stop all containers
docker compose down
docker ps -a  # Check for orphaned containers
```

### Issue: Build fails
```bash
# Clean rebuild
docker compose down -v
docker compose build --no-cache
docker compose up --force-recreate
```

### Issue: WASM compilation error
```bash
# Check Rust target is installed in container
docker compose exec app rustup target list | grep wasm32
```

### Issue: Frontend not updating
```bash
# Restart just the frontend (hot reload should work)
docker compose restart app
```

---

## Current Test Results (Wave 6)

| Feature | Status | Notes |
|---------|--------|-------|
| Docker build | ✅ Pass | All images build successfully |
| WASM compilation | ✅ Pass | fluxera-app compiles to wasm32 |
| Linera deployment | ✅ Pass | Contract deploys to local network |
| **Multi-chain setup** | ✅ Pass | **3 chains created with Fluxera** |
| Frontend loads | ✅ Pass | Dashboard accessible at :5173 |
| Local mode detection | ✅ Pass | Shows "Local Network" |
| Event tracking form | ✅ Pass | Form enabled in local mode |
| **Chain Selector** | ✅ Pass | **Dropdown shows all 3 chains** |
| **Message status tracking** | ✅ Pass | **Sent/Delivered status shown** |
| Cross-chain message form | ✅ Pass | Form enabled in local mode |
| Faucet service | ✅ Pass | GraphiQL available at :8080 |
| Linera GraphQL | ✅ Pass | GraphiQL available at :8081 |
| **Indexer compilation** | ✅ Pass | **Rust indexer-core builds successfully** |
| **Indexer Fluxera connection** | ✅ Pass | **Queries analyticsSummary, recentEvents, messagesWithStatus** |
| **Indexer event polling** | ✅ Pass | **5-second polling loop detects new events** |
| **Indexer message parsing** | ✅ Pass | **FluxeraEvent/Message → NormalizedEvent** |
| **Indexer SQLite storage** | ✅ Pass | **Events persisted with proper indexing** |
| **Indexer REST API** | ✅ Pass | **/health, /stats, /events endpoints working** |
| **Indexer GraphQL API** | ✅ Pass | **/graphql endpoint with async-graphql** |

---

## Wave 6 Completed Features

### Multi-Chain Cross-Chain Messaging (DONE)

#### 1. Multi-Chain Docker Setup ✅
- [x] Create 3 chains in Docker (run.bash)
- [x] Deploy Fluxera to all chains using `request-application`
- [x] Export all chain IDs to frontend environment
- [x] Updated startup logs (7 steps)

#### 2. Smart Contract Enhancements ✅
- [x] Added `MessageStatus` enum (Sent, Delivered, Failed)
- [x] Added `CrossChainMessageV2` struct with status tracking
- [x] Added `DeliveryAck` message type for acknowledgments
- [x] Implemented `.with_tracking()` for bounce detection
- [x] Added chain registry storage

#### 3. Chain Selector UI ✅
- [x] Created `ChainSelector.tsx` component
- [x] Dropdown shows all known Fluxera chains
- [x] Excludes current chain from selection
- [x] Allows custom chain ID entry
- [x] Created `chain-registry.ts` helper

#### 4. Message Status Tracking ✅
- [x] Added `useMessageStatus` hook
- [x] Added `useMessagesWithStatus` hook
- [x] Added `StatusBadge` component to MessageTracer
- [x] Shows sent/delivered status in real-time
- [x] Displays delivery timestamp when delivered

#### 5. Indexer-Core Integration ✅
- [x] `listener.rs` - Queries  Fluxera data via GraphQL
- [x] `main.rs` - Event listening loop (5-second polling)
- [x] `parser.rs` - FluxeraEvent/Message → NormalizedEvent parsing
- [x] REST API endpoints (/health, /stats, /events)
- [x] GraphQL API endpoints (/graphql, /graphiql)
- [x] SQLite storage with proper indexing

---

## Future Developments

### Performance & Caching
- [ ] Implement Redis caching layer
- [ ] Target: <100ms query response time
- [ ] Add geographic latency tracking

### Network Topology Visualizer
- [ ] Visual representation of chain connections
- [ ] Show message flow between chains
- [ ] Interactive chain selection

### Historical Analytics
- [ ] Time-range queries
- [ ] Charts and graphs
- [ ] Export functionality (CSV/JSON)

### Production Deployment
- [ ] Deploy frontend to Vercel/Netlify
- [ ] Fix CORS issues with Conway validators
- [ ] Add persistent wallet storage (localStorage)
- [ ] Mobile responsive design

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Docker startup time | <3min | ~2-3min ✅ |
| Frontend load time | <2s | ~1-2s ✅ |
| Indexer API response | <100ms | ~50ms ✅ |
| Cross-chain query support | Yes | Yes ✅ |
| Event polling interval | 5s | 5s ✅ |
| Cache hit rate | >50% | Not implemented |
| Geographic latency tracking | Yes | Not implemented |

---
