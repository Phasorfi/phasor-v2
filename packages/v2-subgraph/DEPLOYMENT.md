# Subgraph Deployment Guide

This guide covers deploying the Phasor V2 subgraph for both local development and production.

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Production Deployment](#production-deployment)
3. [Update Frontend Configuration](#update-frontend-configuration)

---

## Local Development Setup

**Purpose:** Test subgraph locally with a local blockchain (Hardhat, Anvil, etc.)

**What you need:**
- Docker and Docker Compose
- A local Monad blockchain running on port 8545

### Setup Steps

#### 1. Start Local Blockchain

First, ensure you have a local Monad blockchain running:
```bash
# Example: Using Hardhat or Anvil
# (This depends on your local setup)
```

#### 2. Start Graph Node Stack

From the **project root** (not v2-subgraph directory):

```bash
# Start Graph Node + PostgreSQL + IPFS
docker-compose up -d

# Check logs to ensure services are running
docker-compose logs -f graph-node

# Wait for: "Starting JSON-RPC admin server at: http://0.0.0.0:8020"
```

This starts:
- **Graph Node** on port 8000 (GraphQL), 8020 (admin)
- **PostgreSQL** on port 5432 (data storage)
- **IPFS** on port 5001 (subgraph files)

#### 3. Deploy Contracts Locally

```bash
cd packages/v2-core
# Deploy factory and other contracts to your local chain
# Note the deployed addresses
```

#### 4. Update Local Config

Edit `packages/v2-subgraph/config/monad-testnet/chain.ts` with your local contract addresses if testing locally.

#### 5. Build and Deploy Subgraph

```bash
cd packages/v2-subgraph

# Install dependencies (first time only)
yarn install

# Build the subgraph for Monad testnet config
yarn build --network monad-testnet --subgraph-type v2

# Deploy to local Graph Node
yarn deploy:local
```

#### 6. Query Your Subgraph

```bash
# Check if subgraph is syncing
curl http://localhost:8000/subgraphs/name/uniswap-v2-monad-testnet

# Test a GraphQL query
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs(first: 5) { id token0 { symbol } token1 { symbol } } }"}' \
  http://localhost:8000/subgraphs/name/uniswap-v2-monad-testnet
```

#### 7. Update Frontend for Local Development

Create a `.env.local` file in `packages/phasor-dex`:
```env
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/subgraphs/name/uniswap-v2-monad-testnet
```

---

## Production Deployment

For production, you have three options. **We do NOT use the docker-compose.production.yml file** - that's only if you want to self-host everything.

### Option 1: The Graph Studio (Recommended)

**Best for:** Managed infrastructure, no server costs

**Prerequisites:**
- Wallet with ETH for deployment gas
- Contracts deployed on Monad testnet

**Steps:**

#### 1. Create Subgraph in Studio

1. Go to [thegraph.com/studio](https://thegraph.com/studio)
2. Connect your wallet
3. Click "Create a Subgraph"
4. Name it `phasor-v2-monad-testnet`
5. Copy your **deploy key**

#### 2. Install Graph CLI

```bash
npm install -g @graphprotocol/graph-cli
```

#### 3. Build Subgraph

```bash
cd packages/v2-subgraph

# Build for Monad testnet
yarn build --network monad-testnet --subgraph-type v2
```

#### 4. Authenticate and Deploy

```bash
# Authenticate with your deploy key from Studio
graph auth --studio <YOUR_DEPLOY_KEY>

# Deploy to Studio
graph deploy --studio phasor-v2-monad-testnet
```

#### 5. Get Your GraphQL Endpoint

After deployment, The Graph Studio will provide you with a URL like:
```
https://api.studio.thegraph.com/query/<ID>/phasor-v2-monad-testnet/version/latest
```

**Important:** The Graph Studio handles all infrastructure:
- ✅ PostgreSQL (managed by them)
- ✅ IPFS (managed by them)
- ✅ Graph Node (managed by them)
- ✅ Monitoring and indexing (managed by them)

You just deploy your subgraph code and they handle everything else.

---

### Option 2: Goldsky

**Best for:** High performance, advanced features, managed service

**Prerequisites:**
- Goldsky account
- Contracts deployed on Monad testnet

**Steps:**

#### 1. Sign Up and Install CLI

```bash
# Sign up at goldsky.com
curl https://goldsky.com/install.sh | sh
goldsky login
```

#### 2. Build and Deploy

```bash
cd packages/v2-subgraph

# Build the subgraph
yarn build --network monad-testnet --subgraph-type v2

# Deploy to Goldsky
goldsky subgraph deploy phasor-v2-monad-testnet/v1.0.0 \
  --path ./v2-subgraph.yaml
```

#### 3. Get Your Endpoint

```bash
goldsky subgraph list
```

Your endpoint will be:
```
https://api.goldsky.com/api/public/project_<id>/subgraphs/phasor-v2-monad-testnet/v1.0.0/gn
```

Like The Graph Studio, Goldsky manages all infrastructure for you.

---

## Update Frontend Configuration

After deploying your subgraph, update your frontend to use the production GraphQL endpoint.

### For Vercel Deployment

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add/Update `NEXT_PUBLIC_SUBGRAPH_URL`

**Examples:**

**The Graph Studio:**
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<ID>/phasor-v2-monad-testnet/version/latest
```

**Goldsky:**
```env
NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/project_<id>/subgraphs/phasor-v2-monad-testnet/v1.0.0/gn
```

### Redeploy Frontend

After updating environment variables:

```bash
# Trigger new deployment
git commit --allow-empty -m "Update subgraph URL"
git push
```

Or redeploy in Vercel dashboard:
1. Go to "Deployments" tab
2. Click "..." on latest deployment
3. Click "Redeploy"

---

## Monitoring and Troubleshooting

### Check Subgraph Sync Status

**The Graph Studio:**
- View in dashboard at thegraph.com/studio

**Goldsky:**
- View in dashboard at goldsky.com

### Common Issues

**Subgraph not syncing:**
- Verify RPC endpoint is accessible
- Check factory address in `config/monad-testnet/chain.ts`
- Verify start block is correct
- Check deployment logs in The Graph Studio or Goldsky dashboard

**Missing pairs/tokens:**
- Ensure contracts are deployed on the correct network
- Verify factory address matches deployment
- Check that liquidity has been added on-chain

**Frontend not showing data:**
- Verify `NEXT_PUBLIC_SUBGRAPH_URL` is correct
- Check browser console for GraphQL errors
- Test GraphQL endpoint directly with curl

---

## Recommended Deployment Strategy

### For Development
- Use local Graph Node (root `docker-compose.yml`)
- Point frontend to `http://localhost:8000`

### For Testnet/Production
- **Recommended:** The Graph Studio
  - Free to deploy
  - Managed infrastructure
  - No server costs
  - Easy monitoring

- **Alternative:** Goldsky (if advanced features needed)

---

## Cost Comparison

### Local Development
- **Cost:** $0 (runs on your machine)
- **Use case:** Testing only

### The Graph Studio
- **Cost:** Free for development/testnet
- **Mainnet:** Pay-per-query (very low cost)
- **Use case:** Recommended for testnet and mainnet

### Goldsky
- **Cost:** Free tier available, paid plans for production
- **Use case:** High-performance production deployments
