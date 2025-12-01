#!/bin/bash

# Fluxera Conway Testnet Deployment Script
# This script deploys the Fluxera analytics application to the Linera Conway testnet

set -e  # Exit on error

echo "=======================================--"
echo "Fluxera Conway Testnet Deployment"
echo "========================================="
echo ""

# Configuration
FAUCET_URL="https://faucet.testnet-conway.linera.net"

# Step 1: Checking if linera CLI is installed
echo "📝 Step 1: Checking prerequisites..."
echo "---------------------------------------"

if ! command -v linera &> /dev/null; then
    echo "❌ Error: linera CLI not found"
    echo "Please install linera CLI first:"
    echo "  cargo install linera-service --git https://github.com/linera-io/linera-protocol.git"
    exit 1
fi

echo "✅ Linera CLI found: $(linera --version)"
echo ""

# Step 2: Initializing wallet with Conway testnet
echo "📝 Step 2: Initializing wallet with Conway testnet..."
echo "---------------------------------------"

# Check if wallet already exists (default location)
if [ -f "$HOME/.config/linera/wallet.json" ]; then
    echo "⚠️  Wallet already exists at $HOME/.config/linera/wallet.json"
    echo ""
    linera wallet show
    echo ""
    read -p "Do you want to use this existing wallet? (y/n): " use_existing
    if [ "$use_existing" != "y" ]; then
        echo "❌ Cancelled."
        echo "To use a fresh wallet, backup and remove: $HOME/.config/linera/wallet.json"
        exit 1
    fi

    echo ""
    echo "Using existing wallet. Requesting a new chain from faucet..."
    # Requesting a new chain with tokens from faucet
    linera wallet request-chain --faucet "$FAUCET_URL"

    if [ $? -ne 0 ]; then
        echo "❌ Failed to request chain from faucet"
        exit 1
    fi
else
    echo "No wallet found. Initializing new wallet from Conway faucet..."
    echo "Faucet URL: $FAUCET_URL"
    echo ""

    # Initialize wallet from faucet (gets genesis config + NO chains yet)
    linera wallet init --faucet "$FAUCET_URL"

    if [ $? -ne 0 ]; then
        echo "❌ Failed to initialize wallet from faucet"
        exit 1
    fi

    echo ""
    echo "✅ Wallet initialized. Now requesting a chain with tokens..."

    # Request a chain with tokens
    linera wallet request-chain --faucet "$FAUCET_URL"

    if [ $? -ne 0 ]; then
        echo "❌ Failed to request chain from faucet"
        exit 1
    fi
fi

echo "✅ Wallet ready with testnet chain"
echo ""

# Step 3: Get default chain ID from wallet
echo "📝 Step 3: Getting default chain ID..."
echo "---------------------------------------"

# Show wallet info
WALLET_OUTPUT=$(linera wallet show)
echo "$WALLET_OUTPUT"
echo ""

# Extract default chain ID (the one tagged with DEFAULT)
# Look for the line before "Tags: DEFAULT" which contains the Chain ID
DEFAULT_CHAIN=$(echo "$WALLET_OUTPUT" | grep -B 1 "Tags:.*DEFAULT" | grep "Chain ID:" | awk '{print $NF}')

if [ -z "$DEFAULT_CHAIN" ]; then
    echo "❌ Error: Could not find default chain"
    exit 1
fi

echo "✅ Default chain: $DEFAULT_CHAIN"
echo ""

# Step 4: Build Fluxera contract and service
echo "📝 Step 4: Building Fluxera WASM bytecode..."
echo "---------------------------------------"
cd "$(dirname "$0")"

echo "Building contract and service..."
cargo build --release --target wasm32-unknown-unknown

if [ ! -f "target/wasm32-unknown-unknown/release/fluxera_app_contract.wasm" ]; then
    echo "❌ Error: Contract WASM file not found"
    exit 1
fi

if [ ! -f "target/wasm32-unknown-unknown/release/fluxera_app_service.wasm" ]; then
    echo "❌ Error: Service WASM file not found"
    exit 1
fi

echo "✅ WASM bytecode built successfully"
echo ""

# Step 5: Deploy application to Conway testnet
echo "📝 Step 5: Deploying to Conway testnet..."
echo "---------------------------------------"

DEPLOY_OUTPUT=$(linera project publish-and-create \
    --wait-for-outgoing-messages 2>&1 | tee /dev/tty)

# Extract application ID from output
APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -oP "Application ID: \K[a-f0-9]+")

if [ -z "$APP_ID" ]; then
    # Try alternative pattern
    APP_ID=$(echo "$DEPLOY_OUTPUT" | grep -i "application" | grep -oP "[a-f0-9]{64}")
fi

if [ -z "$APP_ID" ]; then
    echo "⚠️  Warning: Could not automatically extract application ID"
    echo "Please check the output above and enter it manually:"
    read -p "Application ID: " APP_ID
fi

echo ""
echo "✅ Application deployed successfully!"
echo ""

# Step 6: Start local node service to interact with Conway testnet
echo "📝 Step 6: Starting node service..."
echo "---------------------------------------"

echo "Starting local node service (connecting to Conway testnet validators)..."
echo "This will run in the foreground. Press Ctrl+C to stop."
echo ""

# Save deployment info to file first
cat > deployment_info_conway.txt <<EOF
# Fluxera Conway Testnet Deployment
Deployed at: $(date)
Network: Conway Testnet
Faucet URL: $FAUCET_URL
Chain ID: $DEFAULT_CHAIN
Application ID: $APP_ID

# GraphQL Endpoint (when service is running):
http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$APP_ID

# Frontend Configuration:
Update frontend/lib/constants.ts:
  CHAIN_ID: "$DEFAULT_CHAIN"
  APPLICATION_ID: "$APP_ID"
  GRAPHQL_URL: "http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$APP_ID"

# Start service again (if needed):
linera service --port 8080
EOF

echo "========================================="
echo "🎉 Deployment Complete!"
echo "========================================="
echo ""
echo "📋 Deployment Information:"
echo "---------------------------------------"
echo "Network:         Conway Testnet"
echo "Chain ID:        $DEFAULT_CHAIN"
echo "Application ID:  $APP_ID"
echo "Wallet:          $HOME/.config/linera/wallet.json"
echo ""
echo "📝 Deployment info saved to: deployment_info_conway.txt"
echo ""
echo "📝 Next Steps:"
echo "---------------------------------------"
echo "1. The node service will start now (connects to Conway validators)"
echo ""
echo "2. Once service is running, your GraphQL endpoint will be:"
echo "   http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$APP_ID"
echo ""
echo "3. Update frontend configuration:"
echo "   - Edit frontend/lib/constants.ts"
echo "   - Set CHAIN_ID to: $DEFAULT_CHAIN"
echo "   - Set APPLICATION_ID to: $APP_ID"
echo "   - Set GRAPHQL_URL to: http://localhost:8080/chains/$DEFAULT_CHAIN/applications/$APP_ID"
echo ""
echo "4. Test the deployment:"
echo "   ./test_conway.sh"
echo ""
echo "========================================="
echo ""
echo "Starting node service in 3 seconds..."
sleep 3

# Start the service (connects to Conway testnet validators)
linera service --port 8080
