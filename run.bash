#!/usr/bin/env bash

set -eu

echo "=========================================="
echo "  FLUXERA - Data Availability Layer"
echo "  for Linera Blockchain"
echo "  Wave 6: Multi-Chain Support"
echo "=========================================="

# Load NVM for Node.js
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# ==========================================
# STEP 1: Start Linera Local Network
# ==========================================
echo ""
echo "[1/7] Starting Linera local network with faucet..."

eval "$(linera net helper)"
linera_spawn linera net up --with-faucet

export LINERA_FAUCET_URL=http://localhost:8080
echo "Faucet running at: $LINERA_FAUCET_URL"

# ==========================================
# STEP 2: Initialize Wallet and Create Multiple Chains
# ==========================================
echo ""
echo "[2/7] Initializing wallet and creating 3 chains..."

linera wallet init --faucet="$LINERA_FAUCET_URL"

# Request additional chains (need 2 more for total of 3 with owner keys)
echo "Requesting chain 2..."
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"
sleep 1

echo "Requesting chain 3..."
linera wallet request-chain --faucet="$LINERA_FAUCET_URL"
sleep 1

# Now extract all chains that have owner keys (skip ADMIN chain which has "No owner key")
echo ""
echo "Extracting chains with owner keys..."

# Get wallet output
WALLET_OUTPUT=$(linera wallet show 2>&1)
echo "$WALLET_OUTPUT"

# Extract chain IDs that have owner keys (not "No owner key")
CHAINS_WITH_KEYS=$(echo "$WALLET_OUTPUT" | awk '
    /Chain ID:/ { chain_id = $NF }
    /Default owner:/ && !/No owner key/ { print chain_id }
')

echo ""
echo "Chains with owner keys:"
echo "$CHAINS_WITH_KEYS"

# Convert to array (disable unbound variable check temporarily)
set +u
CHAIN_ARRAY=($CHAINS_WITH_KEYS)
NUM_CHAINS=${#CHAIN_ARRAY[@]}
set -u

echo "Found $NUM_CHAINS chains with owner keys"

# We need at least 2 chains for cross-chain messaging
if [ "$NUM_CHAINS" -lt 2 ]; then
    echo "ERROR: Need at least 2 chains with owner keys, found $NUM_CHAINS"
    exit 1
fi

# Assign chains
CHAIN_1="${CHAIN_ARRAY[0]}"
CHAIN_2="${CHAIN_ARRAY[1]}"

# Chain 3 is optional - use Chain 1 as fallback if only 2 chains
if [ "$NUM_CHAINS" -ge 3 ]; then
    CHAIN_3="${CHAIN_ARRAY[2]}"
else
    echo "Warning: Only 2 chains available, using Chain 1 as Chain 3 fallback"
    CHAIN_3="$CHAIN_1"
fi

echo ""
echo "Chain 1 (Primary): $CHAIN_1"
echo "Chain 2: $CHAIN_2"
echo "Chain 3: $CHAIN_3"

# Use Chain 1 as the primary deployment chain
CHAIN_ID=$CHAIN_1
echo ""
echo "Primary chain for deployment: $CHAIN_ID"

# ==========================================
# STEP 3: Build Fluxera WASM Application
# ==========================================
echo ""
echo "[3/7] Building Fluxera WASM application..."

cd /build/fluxera-app
cargo build --release --target wasm32-unknown-unknown

echo "WASM build complete!"

# ==========================================
# STEP 4: Deploy Fluxera Application to Primary Chain
# ==========================================
echo ""
echo "[4/7] Deploying Fluxera to primary chain..."

cd /build

# Publish and create the application on Chain 1
APP_ID=$(linera publish-and-create \
    fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_contract.wasm \
    fluxera-app/target/wasm32-unknown-unknown/release/fluxera_app_service.wasm \
    2>&1 | grep -oE '[a-f0-9]{64}' | tail -1)

echo "Fluxera deployed to Chain 1!"
echo "  Chain ID: $CHAIN_ID"
echo "  App ID:   $APP_ID"

# ==========================================
# STEP 5: Multi-Chain Setup Complete
# ==========================================
echo ""
echo "[5/7] Multi-chain configuration ready..."
echo ""
echo "Fluxera deployed successfully!"
echo "  Chain 1 (Primary): $CHAIN_1"
echo "  Chain 2: $CHAIN_2"
echo "  Chain 3: $CHAIN_3"
echo "  App ID: $APP_ID"
echo ""
echo "Note: Cross-chain messaging works automatically via Linera runtime."
echo "GraphQL endpoint: http://localhost:8080/chains/$CHAIN_ID/applications/$APP_ID"

# ==========================================
# STEP 6: Start Linera Service
# ==========================================
echo ""
echo "[6/7] Starting Linera service on port 8081..."

cd /build

# Start linera service in background to serve GraphQL queries
linera service --port 8081 &
LINERA_SERVICE_PID=$!

# Wait for service to be ready
sleep 3
echo "Linera service running (PID: $LINERA_SERVICE_PID)"

# ==========================================
# STEP 7: Start Frontend
# ==========================================
echo ""
echo "[7/7] Starting frontend on port 5173..."

cd /build/frontend

# Write environment config for local network with multi-chain support
cat > .env.local << EOF
# Primary chain and application
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
NEXT_PUBLIC_APP_ID=$APP_ID

# Multi-chain configuration (Wave 6)
NEXT_PUBLIC_CHAIN_2_ID=$CHAIN_2
NEXT_PUBLIC_CHAIN_3_ID=$CHAIN_3
NEXT_PUBLIC_ALL_CHAINS=$CHAIN_1,$CHAIN_2,$CHAIN_3

# Service URLs
NEXT_PUBLIC_LINERA_SERVICE=http://localhost:8081
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:8081
NEXT_PUBLIC_FAUCET_URL=http://localhost:8080

# Local testing mode
NEXT_PUBLIC_LOCAL_MODE=true
EOF

echo "Frontend config written to .env.local"
echo ""
echo "=========================================="
echo "  MULTI-CHAIN SETUP COMPLETE"
echo "=========================================="
echo "  Chain 1 (Primary): $CHAIN_1"
echo "  Chain 2: $CHAIN_2"
echo "  Chain 3: $CHAIN_3"
echo "  App ID: $APP_ID"
echo ""
echo "  GraphQL endpoints:"
echo "    Chain 1: http://localhost:8081/chains/$CHAIN_1/applications/$APP_ID"
echo "    Chain 2: http://localhost:8081/chains/$CHAIN_2/applications/$APP_ID"
echo "    Chain 3: http://localhost:8081/chains/$CHAIN_3/applications/$APP_ID"
echo "=========================================="

# Install dependencies and start
pnpm install

# Run Next.js on port 5173, bind to all interfaces for Docker
pnpm next dev -p 5173 -H 0.0.0.0

