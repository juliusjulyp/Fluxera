#!/bin/bash

# Fluxera Local Testing Script
# This script demonstrates how to interact with the deployed Fluxera application

# Configuration
CHAIN_ID="04022f7a91f2800b7eb437ab4baa1d8e010854739bbdf64d605705f4c1ecaa99"
APP_ID="63acd9a51e54e1545fc4686159b1f05385f585edcfe93d25e78bdf42e84e62af"
BASE_URL="http://localhost:8080/chains/${CHAIN_ID}/applications/${APP_ID}"

echo "==================================="
echo "Fluxera Application Test Suite"
echo "==================================="
echo ""
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Get Analytics Summary
echo "📊 Test 1: Get Analytics Summary"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { analyticsSummary { totalEvents totalMessages uniqueUsers chainId } }"
  }' | python3 -m json.tool
echo ""

# Test 2: Get Recent Events
echo "📝 Test 2: Get Recent Events (last 5)"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { recentEvents(limit: 5) { eventId eventType owner timestamp data } }"
  }' | python3 -m json.tool
echo ""

# Test 3: Track a New Event
echo "✍️  Test 3: Track New Event (user_action)"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { trackEvent(eventType: \"user_action\", data: \"{\\\"action\\\":\\\"test_from_script\\\",\\\"timestamp\\\":\\\"'$(date -Iseconds)'\\\"}\") }"
  }' | python3 -m json.tool
echo ""

# Test 4: Query Events by Type
echo "🔍 Test 4: Query Events by Type (page_view)"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { eventsByType(eventType: \"page_view\", limit: 10) { eventId eventType data timestamp } }"
  }' | python3 -m json.tool
echo ""

# Test 5: Get Chain Metrics
echo "📈 Test 5: Get Chain Metrics"
echo "-----------------------------------"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { chainMetrics(chainId: \"'$CHAIN_ID'\") { totalEvents uniqueUsers lastActivity eventTypes } }"
  }' | python3 -m json.tool
echo ""

echo "==================================="
echo "All tests completed!"
echo "==================================="
