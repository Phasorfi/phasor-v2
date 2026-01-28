#!/bin/bash

# Check health of local Graph node and subgraphs
# Usage: ./scripts/check-health.sh

set -e

# Load environment variables if .env.local exists
if [ -f .env.local ]; then
    source .env.local
fi

# Set defaults
GRAPH_STATUS=${GRAPH_STATUS:-http://localhost:8030/graphql}
SUBGRAPH_NAME=${SUBGRAPH_NAME:-phasor/v2}
SUBGRAPH_TOKENS_NAME=${SUBGRAPH_TOKENS_NAME:-phasor/v2-tokens}

echo "🏥 Checking Graph Node Health..."
echo ""

# Check if Graph node is running
if ! curl -s $GRAPH_STATUS > /dev/null 2>&1; then
    echo "❌ Graph node is not running at $GRAPH_STATUS"
    echo "   Start it with: ./scripts/setup-local-node.sh"
    exit 1
fi

echo "✅ Graph node is running"
echo ""

# Check indexing status
echo "📊 Indexing Status:"
echo ""

STATUS=$(curl -s $GRAPH_STATUS \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{indexingStatuses { subgraph health synced fatalError { message } chains { network latestBlock { number } chainHeadBlock { number } } } }"}' \
  | python3 -m json.tool 2>/dev/null || echo "{}")

# Check if we got valid JSON
if [ "$STATUS" = "{}" ]; then
    echo "⚠️  Could not fetch indexing status"
    exit 1
fi

echo "$STATUS"
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📍 Endpoints:"
echo "   V2 Subgraph:     http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME"
echo "   Tokens Subgraph: http://localhost:8000/subgraphs/name/$SUBGRAPH_TOKENS_NAME"
echo "   Admin API:       http://localhost:8020"
echo "   Status API:      $GRAPH_STATUS"
echo ""

# Test query
echo "🧪 Testing V2 Subgraph Query:"
TEST_RESULT=$(curl -s http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs(first: 1) { id } }"}' 2>/dev/null || echo '{"errors":[{"message":"subgraph not found"}]}')

if echo "$TEST_RESULT" | grep -q '"data"'; then
    echo "✅ V2 Subgraph is queryable"
    echo "$TEST_RESULT" | python3 -m json.tool 2>/dev/null || echo "$TEST_RESULT"
else
    echo "⚠️  V2 Subgraph may not be deployed or synced yet"
    echo "$TEST_RESULT"
fi

echo ""
echo "🧪 Testing Tokens Subgraph Query:"
TEST_RESULT=$(curl -s http://localhost:8000/subgraphs/name/$SUBGRAPH_TOKENS_NAME \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ tokens(first: 1) { id symbol } }"}' 2>/dev/null || echo '{"errors":[{"message":"subgraph not found"}]}')

if echo "$TEST_RESULT" | grep -q '"data"'; then
    echo "✅ Tokens Subgraph is queryable"
    echo "$TEST_RESULT" | python3 -m json.tool 2>/dev/null || echo "$TEST_RESULT"
else
    echo "⚠️  Tokens Subgraph may not be deployed or synced yet"
    echo "$TEST_RESULT"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Useful commands:"
echo "   View logs:       docker-compose logs -f graph-node"
echo "   Restart:         docker-compose restart"
echo "   Stop:            docker-compose down"
echo "   Redeploy:        yarn deploy:local && yarn deploy:tokens:local"
echo ""
