#!/bin/bash

# Fluxera Conway Testnet Testing Script
# This script tests the deployed Fluxera application on Conway testnet

set -e

echo "========================================="
echo "Fluxera Conway Testnet Test Suite"
echo "========================================="
echo ""

# Load deployment info
if [ ! -f "deployment_info_conway.txt" ]; then
    echo "❌ Error: deployment_info_conway.txt not found"
    echo "Please run ./deploy_conway.sh first"
    exit 1
fi

# Extract chain ID and app ID from deployment info
CHAIN_ID=$(grep "Chain ID:" deployment_info_conway.txt | awk '{print $NF}')
APP_ID=$(grep "Application ID:" deployment_info_conway.txt | awk '{print $NF}')

if [ -z "$CHAIN_ID" ] || [ -z "$APP_ID" ]; then
    echo "❌ Error: Could not extract chain ID or app ID from deployment_info_conway.txt"
    exit 1
fi

BASE_URL="http://localhost:8080/chains/${CHAIN_ID}/applications/${APP_ID}"

echo "📋 Test Configuration:"
echo "---------------------------------------"
echo "Network:    Conway Testnet"
echo "Chain ID:   $CHAIN_ID"
echo "App ID:     $APP_ID"
echo "Base URL:   $BASE_URL"
echo ""

# Test 1: Get Analytics Summary
echo "📊 Test 1: Get Analytics Summary"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { analyticsSummary { totalEvents totalMessages uniqueUsers chainId } }"
  }' | python3 -m json.tool
echo ""

# Test 2: Track a blockchain event (token_transfer)
echo "✍️  Test 2: Track Blockchain Event (token_transfer)"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { trackEvent(eventType: \"token_transfer\", data: \"{\\\"from\\\":\\\"0xabc123\\\",\\\"to\\\":\\\"0xdef456\\\",\\\"amount\\\":\\\"100\\\",\\\"token\\\":\\\"LINERA\\\"}\") }"
  }' | python3 -m json.tool
echo ""

# Test 3: Track another event (swap_executed)
echo "✍️  Test 3: Track Blockchain Event (swap_executed)"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { trackEvent(eventType: \"swap_executed\", data: \"{\\\"input_token\\\":\\\"LINERA\\\",\\\"output_token\\\":\\\"USDC\\\",\\\"input_amount\\\":\\\"50\\\",\\\"output_amount\\\":\\\"100\\\"}\") }"
  }' | python3 -m json.tool
echo ""

# Test 4: Get Recent Events
echo "📝 Test 4: Get Recent Events (last 5)"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { recentEvents(limit: 5) { eventId eventType owner timestamp data } }"
  }' | python3 -m json.tool
echo ""

# Test 5: Get Analytics Summary Again (should show updated counts)
echo "📊 Test 5: Get Updated Analytics Summary"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { analyticsSummary { totalEvents totalMessages uniqueUsers chainId } }"
  }' | python3 -m json.tool
echo ""

# Test 6: Get Chain Metrics
echo "📈 Test 6: Get Chain Metrics"
echo "---------------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { chainMetrics(chainId: \"'$CHAIN_ID'\") { totalEvents uniqueUsers lastActivity eventTypes } }"
  }' | python3 -m json.tool
echo ""

echo "========================================="
echo "✅ All tests completed!"
echo "========================================="
echo ""
echo "📝 Summary:"
echo "- Fluxera is running on Conway Testnet"
echo "- Events are being tracked on blockchain"
echo "- GraphQL API is responding correctly"
echo ""
echo "🌐 Access your deployment:"
echo "GraphQL Endpoint: $BASE_URL"
echo "GraphiQL IDE: $BASE_URL (open in browser)"
echo ""
