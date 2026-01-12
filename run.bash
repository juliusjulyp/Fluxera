#!/usr/bin/env bash

set -eu

echo "=========================================="
echo "  FLUXERA - Data Availability Layer"
echo "  for Linera Blockchain"
echo "=========================================="

# Load NVM for Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# ==========================================
# STEP 1: Start Linera Local Network
# ==========================================
echo ""
echo "[1/5] Starting Linera local network with faucet..."

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
echo "Faucet running at: $LINERA_FAUCET_URL"

# ==========================================
# STEP 2: Initialize Wallet
# ==========================================
echo ""
echo "[2/5] Initializing wallet..."

linera wallet init --faucet="$LINERA_FAUCET_URL"
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"

# Get chain ID for deployment (parse from table format)
CHAIN_ID=$(linera wallet show 2>/dev/null | grep -oE '[a-f0-9]{64}' | head -1)
echo "Using chain: $CHAIN_ID"

# ==========================================
# STEP 3: Build Fluxera WASM Application
# ==========================================
echo ""
echo "[3/5] Building Fluxera WASM application..."

cd /build/fluxera-app
cargo build --release --target wasm32-unknown-unknown

echo "WASM build complete!"

# ==========================================
# STEP 4: Deploy Fluxera Application
# ==========================================
echo ""
echo "[4/5] Deploying Fluxera to Linera..."

cd /build

# Publish and create the application
APP_ID=$(linera publish-and-create \
    fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_contract.wasm \
    fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_service.wasm \
    2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)

echo "Fluxera deployed!"
echo "  Chain ID: $CHAIN_ID"
echo "  App ID:   $APP_ID"
echo ""
echo "GraphQL endpoint: http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID"

# ==========================================
# STEP 5: Start Linera Service
# ==========================================
echo ""
echo "[5/6] Starting Linera service on port 8081..."

cd /build

# Start linera service in background to serve GraphQL queries
linera service --port 8081 &
LINERA_SERVICE_PID=$!

# Wait for service to be ready
sleep 3
echo "Linera service running (PID: $LINERA_SERVICE_PID)"

# ==========================================
# STEP 6: Start Frontend
# ==========================================
echo ""
echo "[6/6] Starting frontend on port 5173..."

cd /build/frontend

# Write environment config for local network
cat > .env.local << EOF
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_APP_ID=$APP_ID
NEXT_PUBLIC_LINERA_SERVICE=http://localhost:8081
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8081
NEXT_PUBLIC_FAUCET_URL=http://localhost:8080
EOF

echo "Frontend config written to .env.local"
echo "GraphQL endpoint: http://localhost:8081/chains/$CHAIN_ID/applications/$APP_ID"

# Install dependencies and start
pnpm install

# Run Next.js on port 5173, bind to all interfaces for Docker
pnpm next dev -p 5173 -H 0.0.0.0

