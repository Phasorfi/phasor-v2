# Monad Testnet - Quick Start

## Network Info

- **Chain ID:** 10143
- **RPC:** https://testnet-rpc.monad.xyz
- **Explorer:** https://testnet.monadexplorer.com
- **Currency:** MON

## Quick Deploy (5 minutes)

### Step 1: Configure

```bash
# 1. Edit config
nano config/monad-testnet/config.json
```

Update with your deployed factory address:
```json
{
  "network": "monad-testnet",
  "factory": "0xYourTestnetFactoryAddress",
  "startblock": "0"
}
```

```bash
# 2. Update token whitelist
nano config/monad-testnet/chain.ts
```

Update addresses:
```typescript
export const FACTORY_ADDRESS = '0xYourTestnetFactoryAddress'
export const REFERENCE_TOKEN = '0xYourWMONAddress'
export const WHITELIST: string[] = [
  '0xYourWMONAddress',
  // Add your test tokens
]
```

### Step 2: Deploy to The Graph Studio

```bash
# Install Graph CLI
npm install -g @graphprotocol/graph-cli

# Build
cd packages/v2-subgraph
yarn install
yarn build --network monad-testnet --subgraph-type v2

# Deploy (will prompt for deploy key)
yarn deploy:testnet
```

Or provide deploy key directly:
```bash
./scripts/deploy-testnet.sh YOUR_DEPLOY_KEY
```

### Step 3: Update Frontend

Add to `.env.local`:
```env
NEXT_PUBLIC_DEFAULT_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0xYourTestnetFactoryAddress
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0xYourTestnetRouterAddress
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<ID>/phasor-v2-testnet/version/latest
```

### Step 4: Deploy to Vercel

Update env vars in Vercel dashboard, then redeploy.

---

## Test Your Deployment

```bash
# Check subgraph is syncing
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  YOUR_SUBGRAPH_URL

# Check for pairs
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ pairs { id } }"}' \
  YOUR_SUBGRAPH_URL
```

---

## Need Help?

See [MONAD-TESTNET-DEPLOYMENT.md](./MONAD-TESTNET-DEPLOYMENT.md) for detailed guide.

---

## Resources

- [The Graph Studio](https://thegraph.com/studio) - Deploy your subgraph (FREE)
- [Monad Testnet Info](https://chainlist.org/chain/10143) - Network details
- [Monad Explorer](https://testnet.monadexplorer.com) - View transactions
