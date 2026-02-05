# Post-Deployment Setup Guide

After deploying contracts with `deploy-testnet.sh`, follow this guide to configure the protocol for operation.

## Overview

The deployment script only deploys contracts and transfers ownership. You still need to:

1. Configure staking pools
2. Set up reward distribution
3. Create initial liquidity pools
4. Deploy and configure the subgraph
5. Update the frontend

## Prerequisites

Ensure you have:
- Deployment manifest from `deployments/deployment-{timestamp}.json`
- Access to multisig (for admin operations)
- Tokens for liquidity (WMON, USDC, etc.)

Set up environment variables:

```bash
# Load from deployment manifest
export FACTORY="0x..."
export ROUTER="0x..."
export PHASOR_TOKEN="0x..."
export VOTING_ESCROW="0x..."
export REWARDS_DISTRIBUTOR="0x..."
export STAKING_REWARDS="0x..."
export LAUNCHPAD_FACTORY="0x..."
export WMON="0x..."

export RPC="https://testnet-rpc.monad.xyz"
```

## 1. Create Liquidity Pools

### Create WMON-USDC Pool

First, ensure you have WMON and USDC tokens.

```bash
# Approve tokens for Router
TOKEN_A=$WMON
TOKEN_B="0xUSDC_ADDRESS"
AMOUNT_A="1000000000000000000000"  # 1000 WMON (18 decimals)
AMOUNT_B="2000000000"              # 2000 USDC (6 decimals)

# Approve WMON
cast send $TOKEN_A "approve(address,uint256)" $ROUTER $AMOUNT_A \
    --private-key $PRIVATE_KEY --rpc-url $RPC

# Approve USDC
cast send $TOKEN_B "approve(address,uint256)" $ROUTER $AMOUNT_B \
    --private-key $PRIVATE_KEY --rpc-url $RPC

# Add liquidity
DEADLINE=$(($(date +%s) + 3600))  # 1 hour from now

cast send $ROUTER \
    "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)" \
    $TOKEN_A $TOKEN_B $AMOUNT_A $AMOUNT_B 0 0 $RECIPIENT $DEADLINE \
    --private-key $PRIVATE_KEY --rpc-url $RPC
```

### Get LP Token Address

```bash
# Get pair address
LP_TOKEN=$(cast call $FACTORY "getPair(address,address)(address)" $TOKEN_A $TOKEN_B --rpc-url $RPC)
echo "WMON-USDC LP: $LP_TOKEN"
```

### Create Additional Pools

Repeat for other pairs:
- WMON-USDT
- WMON-WETH
- WMON-WBTC

## 2. Configure Staking System

These operations require multisig approval.

### Set Staking Token

Configure which LP token can be staked:

```bash
# Via multisig - set WMON-USDC as staking token
cast send $STAKING_REWARDS "setStakingToken(address)" $LP_TOKEN \
    --private-key $MULTISIG_SIGNER_KEY --rpc-url $RPC
```

### Add Pool to RewardsDistributor

```bash
# Via multisig - add staking pool with 100% allocation (1000 points)
cast send $REWARDS_DISTRIBUTOR "addPool(address,uint256)" $STAKING_REWARDS 1000 \
    --private-key $MULTISIG_SIGNER_KEY --rpc-url $RPC
```

### Set Up Keepers

Keepers can trigger weekly reward distributions:

```bash
# Via multisig - add keeper address
cast send $REWARDS_DISTRIBUTOR "setKeeper(address,bool)" $KEEPER_ADDRESS true \
    --private-key $MULTISIG_SIGNER_KEY --rpc-url $RPC
```

### Trigger First Distribution (Optional)

```bash
# Check if distribution is available
cast call $REWARDS_DISTRIBUTOR "canDistribute()(bool)" --rpc-url $RPC

# Trigger distribution (by keeper or owner)
cast send $REWARDS_DISTRIBUTOR "distribute()" \
    --private-key $KEEPER_KEY --rpc-url $RPC
```

## 3. Configure Launchpad

### Verify Platform Configuration

```bash
# Check platform fee (should be 200 = 2%)
cast call $LAUNCHPAD_FACTORY "platformFeeBps()(uint256)" --rpc-url $RPC

# Check fee recipient (should be multisig)
cast call $LAUNCHPAD_FACTORY "platformFeeRecipient()(address)" --rpc-url $RPC

# Check default liquidity percentage
cast call $LAUNCHPAD_FACTORY "defaultLiquidityBps()(uint256)" --rpc-url $RPC
```

### Update Platform Settings (if needed)

```bash
# Via multisig - update platform fee (e.g., to 1.5%)
cast send $LAUNCHPAD_FACTORY "setPlatformFee(uint256)" 150 \
    --private-key $MULTISIG_SIGNER_KEY --rpc-url $RPC

# Via multisig - update default liquidity percentage (e.g., to 40%)
cast send $LAUNCHPAD_FACTORY "setDefaultLiquidityBps(uint256)" 4000 \
    --private-key $MULTISIG_SIGNER_KEY --rpc-url $RPC
```

## 4. Subgraph Configuration

### Update Subgraph Config

Edit `packages/v2-subgraph/config/monad-testnet/config.json`:

```json
{
  "network": "monad-testnet",
  "factory": "0xYourFactoryAddress",
  "startblock": "YOUR_DEPLOY_BLOCK"
}
```

### Update Token Whitelist

Edit `packages/v2-subgraph/config/monad-testnet/chain.ts`:

```typescript
// Factory address (must match config.json)
export const FACTORY_ADDRESS = '0xYourFactoryAddress'.toLowerCase()

// WMON address
export const REFERENCE_TOKEN = '0xWMON_ADDRESS'.toLowerCase()

// Stable pairs for USD pricing (add after creating pools)
export const STABLE_TOKEN_PAIRS: string[] = [
  '0xWMON_USDC_PAIR'.toLowerCase(),
  '0xWMON_USDT_PAIR'.toLowerCase(),
]

// Token whitelist
export const WHITELIST: string[] = [
  '0xWMON_ADDRESS'.toLowerCase(),
  '0xUSDC_ADDRESS'.toLowerCase(),
  '0xUSDT_ADDRESS'.toLowerCase(),
  // Add more tokens...
]

// Stablecoins
export const STABLECOINS = [
  '0xUSDC_ADDRESS'.toLowerCase(),
  '0xUSDT_ADDRESS'.toLowerCase(),
]
```

### Build and Deploy Subgraph

```bash
cd packages/v2-subgraph

# Build for monad-testnet
yarn build --network monad-testnet --subgraph-type v2

# Deploy to The Graph Studio
graph auth --studio YOUR_DEPLOY_KEY
graph deploy --studio phasor-v2-monad-testnet

# Or deploy to local Graph node
yarn graph create --node http://localhost:8020/ phasor-v2
yarn graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001 phasor-v2 v2-subgraph.yaml
```

### Verify Subgraph

```bash
# Query subgraph health
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "{ _meta { block { number } } }"}' \
  YOUR_SUBGRAPH_URL
```

## 5. Frontend Configuration

### Update Environment Variables

Edit `packages/phasor-dex/.env.local` (should be auto-updated by deploy script):

```bash
# Verify addresses are correct
cat packages/phasor-dex/.env.local

# Add subgraph URL after deployment
echo "NEXT_PUBLIC_SUBGRAPH_URL=YOUR_SUBGRAPH_URL" >> packages/phasor-dex/.env.local
```

### Update Token List

Add tokens to `packages/phasor-dex/public/tokenlist.json`:

```json
{
  "name": "Phasor V2 Token List",
  "tokens": [
    {
      "chainId": 10143,
      "address": "0xWMON_ADDRESS",
      "name": "Wrapped Monad",
      "symbol": "WMON",
      "decimals": 18,
      "logoURI": ""
    },
    {
      "chainId": 10143,
      "address": "0xPHASOR_ADDRESS",
      "name": "Phasor Token",
      "symbol": "PHASOR",
      "decimals": 18,
      "logoURI": ""
    }
    // Add more tokens...
  ]
}
```

### Test Frontend

```bash
cd packages/phasor-dex
yarn dev
```

Visit http://localhost:3000 and test:
- [ ] Wallet connection
- [ ] Token selection
- [ ] Swap execution
- [ ] Liquidity operations
- [ ] Staking page
- [ ] Launchpad page

## 6. Verification Checklist

### Contracts

- [ ] All contracts deployed and verified on explorer
- [ ] Ownership transferred to multisig
- [ ] Router points to correct Factory and WMON

### Staking

- [ ] StakingRewards has correct staking token
- [ ] RewardsDistributor has StakingRewards as pool
- [ ] Keeper addresses set
- [ ] Weekly emission rate configured

### Launchpad

- [ ] Platform fee configured
- [ ] Fee recipient is multisig
- [ ] Default liquidity percentage set

### Subgraph

- [ ] Config files updated with correct addresses
- [ ] Subgraph deployed and syncing
- [ ] Queries return expected data

### Frontend

- [ ] All contract addresses configured
- [ ] Subgraph URL configured
- [ ] Token list updated
- [ ] All pages functional

## Common Issues

### "Pool not found" in RewardsDistributor

Ensure you've called `addPool()` with the correct StakingRewards address.

### "Staking token not set"

Call `setStakingToken()` on StakingRewards before users can stake.

### Subgraph not indexing

1. Verify factory address is correct (lowercase)
2. Check startBlock is before any pair creations
3. Ensure Graph node has RPC access

### Frontend shows wrong data

1. Clear browser cache
2. Restart Next.js dev server
3. Verify `.env.local` addresses
4. Check subgraph is synced

## Next Steps

- [Admin Operations Guide](./ADMIN_OPERATIONS.md) - Ongoing protocol management
- [Testnet Guide](./TESTNET.md) - Full testnet deployment process
- [Production Guide](./PRODUCTION.md) - Mainnet deployment
