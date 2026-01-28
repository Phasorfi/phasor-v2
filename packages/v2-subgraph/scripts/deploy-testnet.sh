#!/bin/bash

# Deploy subgraph to The Graph Studio for Monad Testnet
# Usage: ./scripts/deploy-testnet.sh [DEPLOY_KEY]

set -e

DEPLOY_KEY="${1:-}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-phasor-v-2-staging}"

echo "🚀 Deploying Phasor V2 Subgraph to Monad Testnet"
echo "=================================================="
echo ""

# Check if config exists
if [ ! -f "config/monad-testnet/config.json" ]; then
    echo "❌ Error: config/monad-testnet/config.json not found!"
    echo "Please configure your testnet deployment first."
    exit 1
fi

# Show current config
echo "📋 Current Configuration:"
cat config/monad-testnet/config.json
echo ""

# Build subgraph
echo "📦 Building subgraph for Monad Testnet..."
yarn build --network monad-testnet --subgraph-type v2

if [ ! -f "v2-subgraph.yaml" ]; then
    echo "❌ Error: Build failed - v2-subgraph.yaml not found"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Get deploy key if not provided
if [ -z "$DEPLOY_KEY" ]; then
    echo "🔑 Enter your Graph Studio deploy key:"
    echo "(Get it from https://thegraph.com/studio)"
    read -r DEPLOY_KEY
fi

# Authenticate
echo ""
echo "🔐 Authenticating with The Graph Studio..."
graph auth "$DEPLOY_KEY"

# Deploy
echo ""
echo "🚀 Deploying to The Graph Studio..."
graph deploy "$SUBGRAPH_NAME" v2-subgraph.yaml

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "=================================================="
echo "Next steps:"
echo "1. Go to https://thegraph.com/studio"
echo "2. Copy your subgraph query URL"
echo "3. Update your Vercel env var:"
echo "   NEXT_PUBLIC_SUBGRAPH_URL=<your-query-url>"
echo "4. Redeploy your frontend"
echo ""
