# Monad Testnet Subgraph Deployment Guide

This guide walks you through deploying your Phasor V2 subgraph to Monad Testnet.

## Monad Testnet Network Details

- **Network Name:** Monad Testnet
- **Chain ID:** 10143
- **RPC URL:** https://testnet-rpc.monad.xyz
- **Currency:** MON
- **Block Explorer:** https://testnet.monadexplorer.com

**Sources:**
- [Monad Testnet on ChainList](https://chainlist.org/chain/10143)
- [Monad Developer Documentation](https://docs.monad.xyz/developer-essentials/network-information)

---

## Prerequisites

1. **Deploy contracts to Monad Testnet**
   - You need to deploy your Uniswap V2 contracts to Monad Testnet first
   - Get testnet MON from the faucet
   - Note down the deployed Factory and Router addresses

2. **Get Monad Testnet RPC**
   - Public RPC: `https://testnet-rpc.monad.xyz`
   - Or use a dedicated RPC provider like [Alchemy](https://www.alchemy.com/rpc/monad-testnet) or [dRPC](https://drpc.org/chainlist/monad-testnet-rpc)

---

## Step 1: Update Configuration

### 1.1 Update Factory Address

Edit `config/monad-testnet/config.json`:

```json
{
  "network": "monad-testnet",
  "factory": "0xYourDeployedFactoryAddress",
  "startblock": "0"
}
```

Replace `0xYourDeployedFactoryAddress` with your actual factory address from your testnet deployment.

**Tip:** To get the start block, use:
```bash
cast block-number --rpc-url https://testnet-rpc.monad.xyz
```

### 1.2 Update Chain Configuration

Edit `config/monad-testnet/chain.ts`:

```typescript
// Update these with your testnet addresses
export const FACTORY_ADDRESS = '0xYourDeployedFactoryAddress'
export const REFERENCE_TOKEN = '0xYourWMONAddress'

export const WHITELIST: string[] = [
  '0xYourWMONAddress', // WMON
  '0xYourTestToken1',  // Test token 1
  '0xYourTestToken2',  // Test token 2
]
```

---

## Step 2: Build the Subgraph

```bash
cd packages/v2-subgraph
yarn install
yarn build --network monad-testnet --subgraph-type v2
```

This will generate `v2-subgraph.yaml` configured for Monad Testnet.

---

## Step 3: Deploy to The Graph Studio

### Option 1: The Graph Studio (Recommended - FREE)

1. **Create Subgraph**
   - Go to [thegraph.com/studio](https://thegraph.com/studio)
   - Connect your wallet
   - Click "Create a Subgraph"
   - Name: `phasor-v2-testnet`
   - Network: Will be configured from your manifest

2. **Get Deploy Key**
   - Copy the deploy key from your subgraph dashboard

3. **Authenticate**
   ```bash
   graph auth --studio YOUR_DEPLOY_KEY
   ```

4. **Deploy**
   ```bash
   graph deploy --studio phasor-v2-testnet v2-subgraph.yaml
   ```

5. **Get Endpoint**
   - Your endpoint: `https://api.studio.thegraph.com/query/<ID>/phasor-v2-testnet/version/latest`
   - Copy this for your frontend

### Option 2: Self-Hosted (For Development)

If you want to test locally or on your own server:

```bash
# Update docker-compose.yml with testnet RPC
nano docker-compose.yml
# Change: ethereum: 'monad:https://testnet-rpc.monad.xyz'

# Start Graph node
docker-compose up -d

# Deploy
./scripts/deploy-local.sh
```

---

## Step 4: Update Frontend for Testnet

### 4.1 Update Environment Variables

Create or update `.env.local` in `packages/phasor-dex/`:

```env
# Monad Testnet Configuration
NEXT_PUBLIC_DEFAULT_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=https://testnet-rpc.monad.xyz

# Deployed Contracts (from your testnet deployment)
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0xYourTestnetFactoryAddress
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0xYourTestnetRouterAddress
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=0xYourTestnetWMONAddress

# Subgraph (from Graph Studio)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<ID>/phasor-v2-testnet/version/latest
```

### 4.2 Update Chain Configuration

Edit `packages/phasor-dex/config/chains.ts` to add testnet:

```typescript
export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: ["https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet.monadexplorer.com",
    },
  },
  testnet: true,
});
```

### 4.3 Update Wagmi Config

Edit `packages/phasor-dex/config/index.ts`:

```typescript
import { monad, monadTestnet } from "./chains";

export const config = getDefaultConfig({
  appName: "Phasor",
  projectId: process.env.NEXT_PUBLIC_DEFAULT_WALLET_CONNECT_ID || "YOUR_PROJECT_ID",
  // Add both mainnet and testnet
  chains: [monad, monadTestnet],
  ssr: false,
});
```

---

## Step 5: Test Your Deployment

### 5.1 Check Subgraph Health

```bash
# Test the endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  https://api.studio.thegraph.com/query/<ID>/phasor-v2-testnet/version/latest
```

Expected response:
```json
{
  "data": {
    "_meta": {
      "block": {
        "number": 12345
      }
    }
  }
}
```

### 5.2 Check for Pairs

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs(first: 5) { id token0 { symbol } token1 { symbol } } }"}' \
  https://api.studio.thegraph.com/query/<ID>/phasor-v2-testnet/version/latest
```

### 5.3 Test Frontend

```bash
cd packages/phasor-dex
npm run dev
```

1. Open http://localhost:3000
2. Connect wallet to Monad Testnet (Chain ID 10143)
3. Navigate to pools page
4. Verify pools are loading from subgraph

---

## Step 6: Deploy Frontend to Vercel (Testnet)

### Option A: Separate Deployment for Testnet

1. **Create a new Vercel project** for testnet
2. Set environment variables in Vercel dashboard (all the testnet env vars above)
3. Deploy

### Option B: Use Branch-based Deployment

1. **Create a testnet branch:**
   ```bash
   git checkout -b testnet
   git add .
   git commit -m "Configure for Monad testnet"
   git push origin testnet
   ```

2. **Configure Vercel:**
   - Go to Vercel dashboard
   - Set testnet env vars for the `testnet` branch
   - Vercel will auto-deploy testnet branch to a preview URL

---

## Troubleshooting

### Subgraph Not Syncing

**Problem:** Subgraph shows 0 blocks indexed

**Solutions:**
1. Check if factory contract exists on testnet:
   ```bash
   cast code 0xYourFactoryAddress --rpc-url https://testnet-rpc.monad.xyz
   ```

2. Verify factory address in config matches deployed address

3. Check if any pairs exist:
   ```bash
   cast call 0xYourFactoryAddress "allPairsLength()" --rpc-url https://testnet-rpc.monad.xyz
   ```

4. If 0 pairs, create a test pair first through your frontend

### RPC Rate Limiting

**Problem:** Subgraph syncing slowly or failing

**Solutions:**
1. Use a dedicated RPC provider (Alchemy, dRPC)
2. Add rate limiting configuration to The Graph Studio
3. Use your own Monad testnet node

### Frontend Not Connecting

**Problem:** Wallet won't connect to Monad Testnet

**Solutions:**
1. Manually add network to MetaMask using details above
2. Verify CHAIN_ID is set to 10143
3. Check RPC URL is correct in wagmi config

---

## Quick Deploy Script

Save this as `deploy-testnet.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying to Monad Testnet"

# 1. Build subgraph
cd packages/v2-subgraph
yarn build --network monad-testnet --subgraph-type v2

# 2. Deploy to The Graph Studio
echo "Enter your Graph Studio deploy key:"
read DEPLOY_KEY
graph auth --studio $DEPLOY_KEY
graph deploy --studio phasor-v2-testnet v2-subgraph.yaml

echo "✅ Subgraph deployed!"
echo ""
echo "Next steps:"
echo "1. Copy your subgraph URL from Studio dashboard"
echo "2. Update NEXT_PUBLIC_SUBGRAPH_URL in Vercel"
echo "3. Redeploy frontend"
```

Make it executable:
```bash
chmod +x deploy-testnet.sh
./deploy-testnet.sh
```

---

## Summary Checklist

- [ ] Contracts deployed to Monad Testnet
- [ ] Factory address updated in `config/monad-testnet/config.json`
- [ ] Token addresses updated in `config/monad-testnet/chain.ts`
- [ ] Subgraph built with `yarn build --network monad-testnet --subgraph-type v2`
- [ ] Subgraph deployed to The Graph Studio
- [ ] Frontend env vars updated for testnet
- [ ] Frontend deployed to Vercel (or testnet branch)
- [ ] Tested end-to-end: wallet connect → view pools → add liquidity

---

## Resources

- **Monad Testnet:** [ChainList](https://chainlist.org/chain/10143)
- **The Graph Studio:** [thegraph.com/studio](https://thegraph.com/studio)
- **Monad Explorer:** [testnet.monadexplorer.com](https://testnet.monadexplorer.com)
- **Monad Developer Docs:** [docs.monad.xyz](https://docs.monad.xyz/developer-essentials/network-information)
