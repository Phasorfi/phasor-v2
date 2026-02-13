# Testnet Deployment Guide

This guide covers deploying Phasor V2 to Monad testnet.

## Overview

The testnet deployment deploys the complete Phasor ecosystem (19 contracts):

| Category | Contracts |
|----------|-----------|
| Core DEX | PoolImplementation, PoolFactory, Router |
| Libraries | BalanceLogicLibrary, DelegationLogicLibrary, PerlinNoise, Trig |
| Factories | GaugeFactory, VotingRewardsFactory, ManagedRewardsFactory, FactoryRegistry |
| ve(3,3) Governance | Phasor, Forwarder, VotingEscrow, VeArtProxy, Voter, RewardsDistributor, Minter |
| Launchpad | VelodromeLauncher |

After deployment, ownership of all contracts is transferred to the multisig.

## Prerequisites

### Required Tools

```bash
forge --version    # Foundry
cast --version     # Foundry
node --version     # Node.js
jq --version       # JSON processor
npx @usecannon/cli --version  # Cannon CLI
```

### Install Dependencies

```bash
# Install Cannon CLI (if not installed)
npm install -g @usecannon/cli

# Install project dependencies
npm install
```

### Required Accounts

1. **Deployer EOA**: An externally owned account with MON for gas
2. **Multisig**: A Safe multisig that will own all protocol contracts

### Monad Testnet Details

| Property | Value |
|----------|-------|
| Network Name | Monad Testnet |
| Chain ID | 10143 |
| RPC URL | `https://testnet-rpc.monad.xyz` |
| Explorer | `https://testnet.monadexplorer.com` |

## Pre-Deployment Setup

### 1. Configure Addresses

Edit `cannonfile.toml` and update the `[var.main]` section:

```toml
[var.main]
# Your deployer EOA
deployer = "0xYourDeployerAddress"

# Your multisig (Safe)
safe = "0xYourMultisigAddress"

# WMON address on Monad testnet (usually pre-deployed)
WMON = "0xbbdbCfEf20072142e233F61eD26005c7d2983C5f"

# Existing testnet token addresses for Voter whitelist
# Set to 0x0 for tokens you don't want to whitelist yet
USDC = "0xYourTestnetUSDC"
WETH = "0xYourTestnetWETH"
WBTC = "0xYourTestnetWBTC"
```

### 2. Fund Deployer

Ensure your deployer has sufficient MON:
- Minimum: 1 MON
- Recommended: 2-3 MON (includes gas buffer)

Get testnet MON from the Monad faucet.

### 3. Set Environment Variables

```bash
# Required: Your deployer private key
export DEPLOYER_PRIVATE_KEY="0xYourPrivateKey"

# Optional: Override defaults
export RPC_URL="https://testnet-rpc.monad.xyz"
export CHAIN_ID="10143"
```

## Deployment with Script

### Run the Script

```bash
chmod +x deploy-testnet.sh
./deploy-testnet.sh
```

The script will:

1. **Pre-flight checks** — dependencies, RPC connectivity, WMON contract, deployer balance
2. **Compile contracts** — `forge build`, then prompts to continue
3. **Dry-run** — `cannon build --dry-run` to estimate gas, then prompts to continue
4. **Deploy** — `cannon build` sends real transactions
5. **Verify** — checks all ownership transfers succeeded
6. **Update configs** — writes `.env.production` files for frontend and indexer, then prompts to continue
7. **Generate manifest** — saves all addresses to `deployments/deployment-testnet-*.json`

### Script Prompts

The script stops at each stage and asks for confirmation:

```
✓ Compilation successful. Continue to gas estimation? [y/N]
✓ Review the dry-run output above. Proceed with actual deployment? [y/N]
  Update configuration files (frontend, envio, manifest)? [y/N]
```

## Manual Deployment

If you prefer to deploy manually without the script:

### Step 1: Compile

```bash
forge build
```

### Step 2: Dry-Run (Estimate Gas)

```bash
npx @usecannon/cli build cannonfile.toml \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz \
  --chain-id 10143 \
  --dry-run
```

Review the output to understand gas costs. If everything looks good, proceed.

### Step 3: Deploy

```bash
npx @usecannon/cli build cannonfile.toml \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --rpc-url https://testnet-rpc.monad.xyz \
  --chain-id 10143
```

Save the output — it contains all deployed contract addresses.

### Step 4: Verify Ownership

```bash
RPC="https://testnet-rpc.monad.xyz"

# Phasor minter should be the Minter contract
cast call $PHASOR_ADDRESS "minter()(address)" --rpc-url $RPC

# PoolFactory admin should be multisig
cast call $POOL_FACTORY "poolAdmin()(address)" --rpc-url $RPC

# VotingEscrow team should be multisig
cast call $VOTING_ESCROW "team()(address)" --rpc-url $RPC

# Voter governor should be multisig
cast call $VOTER "governor()(address)" --rpc-url $RPC

# Minter team should be multisig
cast call $MINTER "team()(address)" --rpc-url $RPC

# VelodromeLauncher owner should be multisig
cast call $VELODROME_LAUNCHER "owner()(address)" --rpc-url $RPC
```

### Step 5: Update Configs Manually

Create `packages/phasor-dex/.env.production` with:

```bash
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_POOL_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=0x...
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_VOTING_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_VOTER_ADDRESS=0x...
NEXT_PUBLIC_REWARDS_DISTRIBUTOR_ADDRESS=0x...
NEXT_PUBLIC_MINTER_ADDRESS=0x...
NEXT_PUBLIC_VELODROME_LAUNCHER_ADDRESS=0x...
```

Create `packages/envio-indexer/.env.production` with:

```bash
ENVIO_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
ENVIO_MONAD_WMON_ADDRESS=0x...
ENVIO_MONAD_USDC_ADDRESS=0x...
ENVIO_MONAD_PHASOR_ADDRESS=0x...
ENVIO_MONAD_POOL_FACTORY_ADDRESS=0x...
```

## Environment Separation

Local development and testnet configs are kept separate so they don't overwrite each other.

### Frontend (Next.js)

| File | When Loaded | Written By |
|------|-------------|------------|
| `.env.development` | `next dev` | `deploy-local-full.sh` |
| `.env.production` | `next build` / `next start` | `deploy-testnet.sh` |
| `.env.local` | Always (override) | Manual only |

- **Local dev**: `cd packages/phasor-dex && next dev` (loads `.env.development`)
- **Testnet build**: `cd packages/phasor-dex && next build` (loads `.env.production`)

### Envio Indexer

Envio reads `.env` directly. Use the npm scripts to switch:

```bash
cd packages/envio-indexer

# For local development
npm run dev:local    # copies .env.development → .env, then runs envio dev

# For testnet
npm run dev:testnet  # copies .env.production → .env, then runs envio dev
```

## Deployment Artifacts

After deployment, find these files:

| File | Location | Description |
|------|----------|-------------|
| Manifest | `deployments/deployment-testnet-*.json` | All addresses and config |
| Cannon Log | `deployments/cannon-output-*.log` | Full deployment output |
| Dry-Run Log | `deployments/dry-run-*.log` | Gas estimation output |
| Frontend Env | `packages/phasor-dex/.env.production` | Testnet environment |
| Envio Env | `packages/envio-indexer/.env.production` | Indexer environment |

## Troubleshooting

### "Cannot connect to RPC"
1. Check internet connectivity
2. Verify RPC URL is correct
3. Try alternative RPC endpoints

### "WMON contract not found"
1. Verify WMON address in `cannonfile.toml`
2. Check if contract exists on block explorer

### "Dry-run failed"
1. Check for compilation errors: `forge build`
2. Verify artifact paths in `cannonfile.toml` match files in `packages/velodrome-fork/contracts/`
3. Check library gas limits (default 5M should be sufficient)

### "Deployment failed"
1. Check `deployments/cannon-output-*.log` for details
2. Verify private key is correct
3. Ensure nonce is not stuck (check pending transactions)
4. Ensure sufficient balance

### "Ownership verification failed"
1. Check Cannon log for invoke errors
2. Manually verify on block explorer
3. May need to manually call ownership transfer functions

## Security Checklist

Before deploying:

- [ ] Deployer private key is secure (not committed to git)
- [ ] Multisig is properly configured with appropriate threshold
- [ ] All team members have verified the addresses in `cannonfile.toml`
- [ ] Token addresses for Voter whitelist are correct
- [ ] Deployer has only necessary balance

After deploying:

- [ ] All ownership transferred to multisig (verified by script)
- [ ] 100M PHASOR minted to multisig
- [ ] Contracts verified on block explorer
- [ ] Deployment manifest saved securely
- [ ] Team notified of deployment

## Next Steps

1. [Create liquidity pools and configure protocol](./POST_DEPLOYMENT_SETUP.md)
2. Deploy the Envio indexer
3. Build and deploy the frontend
