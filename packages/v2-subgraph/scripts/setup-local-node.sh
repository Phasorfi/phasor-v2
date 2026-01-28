#!/bin/bash

# Setup script for local Graph node
set -e

echo "🚀 Setting up local Graph node for Phasor V2..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.local.example .env.local
    echo "⚠️  Please edit .env.local and configure your MONAD_RPC_URL"
    echo "   Then run this script again."
    exit 0
fi

# Load environment variables
source .env.local

echo "✅ Environment loaded"
echo "   RPC: $MONAD_RPC_URL"

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data/ipfs data/postgres

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

# Wait for Graph node to be ready
echo "🔍 Checking Graph node health..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8030/graphql > /dev/null 2>&1; then
        echo "✅ Graph node is ready!"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "   Waiting for Graph node... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Graph node failed to start. Check logs with: docker-compose logs graph-node"
    exit 1
fi

echo ""
echo "✅ Local Graph node is running!"
echo ""
echo "📊 Graph Node Endpoints:"
echo "   GraphQL HTTP: http://localhost:8000/subgraphs/name/<subgraph-name>"
echo "   GraphQL WS:   ws://localhost:8001/subgraphs/name/<subgraph-name>"
echo "   Admin:        http://localhost:8020"
echo "   Index Status: http://localhost:8030/graphql"
echo ""
echo "📦 IPFS:"
echo "   API:          http://localhost:5001"
echo ""
echo "🗄️  PostgreSQL:"
echo "   Host:         localhost:5432"
echo "   Database:     graph-node"
echo "   User:         graph-node"
echo "   Password:     let-me-in"
echo ""
echo "Next steps:"
echo "1. Deploy your subgraphs:"
echo "   yarn deploy:local"
echo "   yarn deploy:tokens:local"
echo ""
echo "2. Query your subgraphs at:"
echo "   http://localhost:8000/subgraphs/name/$SUBGRAPH_NAME"
echo "   http://localhost:8000/subgraphs/name/$SUBGRAPH_TOKENS_NAME"
echo ""
