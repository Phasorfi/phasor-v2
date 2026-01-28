#!/bin/bash

# Deploy v2-tokens subgraph to The Graph Studio for Monad Testnet
# Usage: ./scripts/deploy-tokens-testnet.sh [DEPLOY_KEY]

set -e

DEPLOY_KEY="${1:-}"
SUBGRAPH_NAME="${SUBGRAPH_NAME:-v-2-tokens-staging}"

echo "🚀 Deploying Phasor V2 Tokens Subgraph to Monad Testnet"
echo "========================================================="
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
echo "📦 Building v2-tokens subgraph for Monad Testnet..."
yarn build --network monad-testnet --subgraph-type v2-tokens

if [ ! -f "v2-tokens-subgraph.yaml" ]; then
    echo "❌ Error: Build failed - v2-tokens-subgraph.yaml not found"
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
graph deploy "$SUBGRAPH_NAME" v2-tokens-subgraph.yaml

echo ""
echo "✅ Deployment Complete!"
echo ""
echo "========================================================="
echo "Next steps:"
echo "1. Go to https://thegraph.com/studio"
echo "2. Copy your tokens subgraph query URL"
echo "3. Update your Vercel env var:"
echo "   NEXT_PUBLIC_TOKENS_SUBGRAPH_URL=<your-query-url>"
echo "4. Redeploy your frontend"
echo ""
