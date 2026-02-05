# Testnet Deployment Guide

This guide covers deploying Phasor V2 to Monad testnet.

## Overview

The testnet deployment deploys the complete Phasor ecosystem:

| Contract | Description |
|----------|-------------|
| UniswapV2Factory | Creates new trading pairs |
| UniswapV2Router02 | Handles swaps and liquidity |
| PhasorToken | Native PHASOR token (ERC20 with mint) |
| VotingEscrow | vePHASOR for governance and boost |
| RewardsDistributor | Weekly PHASOR emissions |
| StakingRewards | LP staking with ve-boost |
| FairLaunchTemplate | Template for token launches |
| LaunchpadFactory | Creates FairLaunch sales |

After deployment, ownership of all contracts is transferred to the multisig.

## Prerequisites

### Required Tools

```bash
# Check Foundry
forge --version
cast --version

# Check Node.js
node --version
npm --version

# Check utilities
jq --version
bc --version
```

### Install Dependencies

```bash
# Install project dependencies
yarn install

# Install Cannon CLI (if not installed)
npm install -g @usecannon/cli
```

### Required Accounts

1. **Deployer EOA**: An externally owned account with MON for gas
2. **Multisig**: A Safe multisig that will own all protocol contracts

### Monad Testnet Details

| Property | Value |
|----------|-------|
| Network Name | Monad Testnet |
| Chain ID | 10143 |
| RPC URL | https://testnet-rpc.monad.xyz |
| Explorer | https://testnet.monadexplorer.com |

## Pre-Deployment Setup

### 1. Configure Addresses

Edit `cannonfile.toml` and update the addresses:

```toml
[var.main]
# Your deployer EOA
deployer = "0xYourDeployerAddress"

# Your multisig (Safe)
safe = "0xYourMultisigAddress"

# WMON address on Monad testnet
WMON = "0xbbdbCfEf20072142e233F61eD26005c7d2983C5f"
```

### 2. Fund Deployer

Ensure your deployer has sufficient MON:
- Minimum: 0.5 MON
- Recommended: 1-2 MON

Get testnet MON from the Monad faucet.

### 3. Set Environment Variables

```bash
# Required: Your deployer private key
export DEPLOYER_PRIVATE_KEY="0xYourPrivateKey"

# Optional: Override defaults
export RPC_URL="https://testnet-rpc.monad.xyz"
export CHAIN_ID="10143"
export MAX_GAS_PRICE="50"  # Max gas price in gwei
```

## Deployment

### Run Deployment Script

```bash
./deploy-testnet.sh
```

The script will:
1. Check all dependencies
2. Validate RPC connectivity
3. Verify WMON contract exists
4. Estimate gas costs
5. Request confirmation before proceeding
6. Compile contracts
7. Calculate INIT_CODE_HASH
8. Deploy via Cannon
9. Verify ownership transfers
10. Update configuration files
11. Generate deployment manifest

### Expected Output

```
============================================
  Phasor V2 - Testnet Deployment
============================================
Network: Monad Testnet (Chain ID: 10143)
RPC:     https://testnet-rpc.monad.xyz

[HH:MM:SS] Checking dependencies...
✓ forge v0.2.0
✓ cast available
✓ cannon available
...

[HH:MM:SS] Estimating deployment gas costs...

Contract Deployments:
Contract                  Est. Gas
----------------------------------------
UniswapV2Factory          2500000
UniswapV2Router02         4500000
...

Estimated deployment cost: ~0.25 MON (at 2.0 gwei)

Proceed with deployment? [y/N]: y

[HH:MM:SS] Deploying contracts with Cannon...
...

========================================
  Deployment Complete!
========================================
```

## Post-Deployment

### 1. Verify Ownership

The script automatically verifies ownership, but you can manually check:

```bash
RPC="https://testnet-rpc.monad.xyz"

# Factory feeToSetter should be multisig
cast call $FACTORY "feeToSetter()(address)" --rpc-url $RPC

# RewardsDistributor owner should be multisig
cast call $REWARDS_DISTRIBUTOR "owner()(address)" --rpc-url $RPC

# PhasorToken owner should be RewardsDistributor
cast call $PHASOR_TOKEN "owner()(address)" --rpc-url $RPC

# LaunchpadFactory owner should be multisig
cast call $LAUNCHPAD_FACTORY "owner()(address)" --rpc-url $RPC
```

### 2. Contract Verification

Verify contracts on the block explorer for transparency:

```bash
# Example verification command (adjust for your explorer)
forge verify-contract $FACTORY_ADDRESS \
    packages/core/contracts/UniswapV2Factory.sol:UniswapV2Factory \
    --chain-id 10143 \
    --constructor-args $(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)
```

### 3. Update Subgraph

See [POST_DEPLOYMENT_SETUP.md](./POST_DEPLOYMENT_SETUP.md#subgraph-configuration) for subgraph deployment.

### 4. Configure Protocol

See [POST_DEPLOYMENT_SETUP.md](./POST_DEPLOYMENT_SETUP.md) for:
- Staking pool setup
- Keeper configuration
- Liquidity pool creation

## Deployment Artifacts

After deployment, find these files:

| File | Location | Description |
|------|----------|-------------|
| Manifest | `deployments/deployment-{timestamp}.json` | All addresses and config |
| Cannon Log | `deployments/cannon-output-{timestamp}.log` | Full deployment output |
| Frontend Env | `packages/phasor-dex/.env.local` | Updated environment |
| Subgraph Config | `packages/v2-subgraph/config/monad-testnet/config.json` | Updated factory/block |

## Troubleshooting

### "Cannot connect to RPC"

1. Check internet connectivity
2. Verify RPC URL is correct
3. Try alternative RPC endpoints

### "WMON contract not found"

1. Verify WMON address in cannonfile.toml
2. Check if contract exists on block explorer
3. You may need to deploy WETH9 as WMON first

### "Insufficient balance"

1. Get more testnet MON from faucet
2. Or set `MAX_GAS_PRICE` lower (may cause slow transactions)

### "Compilation failed"

1. Run `yarn install` to ensure dependencies
2. Run `forge clean` to clear build cache
3. Check for Solidity version mismatches

### "Deployment failed"

1. Check `deployments/cannon-output-{timestamp}.log` for details
2. Verify private key is correct
3. Ensure nonce is not stuck (check pending transactions)

### "Ownership verification failed"

1. Check Cannon log for invoke errors
2. Manually verify on block explorer
3. May need to manually call ownership transfer functions

## Security Checklist

Before deploying:

- [ ] Deployer private key is secure (not committed to git)
- [ ] Multisig is properly configured
- [ ] Multisig threshold is appropriate (e.g., 2/3 or 3/5)
- [ ] Deployer has only necessary balance
- [ ] All team members have verified the addresses

After deploying:

- [ ] All ownership transferred to multisig
- [ ] Contracts verified on block explorer
- [ ] Deployment manifest saved securely
- [ ] Team notified of deployment
- [ ] Test transactions work correctly

## Next Steps

1. [Configure the protocol](./POST_DEPLOYMENT_SETUP.md)
2. [Set up admin operations](./ADMIN_OPERATIONS.md)
3. [Deploy the subgraph](../../packages/v2-subgraph/MONAD-TESTNET-DEPLOYMENT.md)
