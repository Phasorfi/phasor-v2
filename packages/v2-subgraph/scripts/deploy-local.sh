#!/bin/bash

# Deploy subgraph to local Graph node
# Usage: ./scripts/deploy-local.sh

set -e

# Load environment variables if .env.local exists
if [ -f .env.local ]; then
    source .env.local
fi

# Set defaults
GRAPH_NODE=${GRAPH_NODE_ADMIN:-http://localhost:8020}
IPFS_NODE=${GRAPH_IPFS:-http://localhost:5001}
SUBGRAPH_NAME=${SUBGRAPH_NAME:-phasor/v2}

echo "📦 Deploying V2 Subgraph to local Graph node..."
echo "   Graph Node: $GRAPH_NODE"
echo "   IPFS: $IPFS_NODE"
echo "   Subgraph: $SUBGRAPH_NAME"
echo ""

# Check if Graph node is running
if ! curl -s $GRAPH_NODE > /dev/null 2>&1; then
    echo "❌ Graph node is not running at $GRAPH_NODE"
    echo "   Start it with: ./scripts/setup-local-node.sh"
    exit 1
fi

# Build subgraph
echo "🔨 Building subgraph..."
yarn build --network monad-testnet --subgraph-type v2

# Create subgraph (ignore error if already exists)
echo "📝 Creating subgraph..."
yarn graph create --node $GRAPH_NODE/ $SUBGRAPH_NAME || true

# Deploy subgraph
echo "🚀 Deploying subgraph..."
yarn graph deploy --node $GRAPH_NODE/ --ipfs $IPFS_NODE $SUBGRAPH_NAME v2-subgraph.yaml --version-label v$(date +%s)

echo ""
echo "✅ V2 Subgraph deployed successfully!"
echo "   GraphQL endpoint: http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME"
echo ""
echo "🔍 Check indexing status:"
echo "   curl http://localhost:8030/graphql -X POST -d '{\"query\": \"{indexingStatuses { subgraph health synced }}\"}')"
echo ""
