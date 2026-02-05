# Admin Operations Guide

This guide covers ongoing protocol administration via the multisig.

## Overview

All admin operations require multisig approval. The multisig owns:
- **UniswapV2Factory**: Can set fee recipient and enable protocol fees
- **RewardsDistributor**: Can manage pools, emissions, and keepers
- **LaunchpadFactory**: Can update platform fees and templates

The **PhasorToken** is owned by RewardsDistributor (for minting), not the multisig directly.

## Setup

```bash
# Contract addresses (from deployment)
export FACTORY="0x..."
export REWARDS_DISTRIBUTOR="0x..."
export STAKING_REWARDS="0x..."
export LAUNCHPAD_FACTORY="0x..."
export PHASOR_TOKEN="0x..."

export RPC="https://testnet-rpc.monad.xyz"
export SAFE="0xYourMultisigAddress"
```

## UniswapV2Factory Operations

### Enable Protocol Fee

The factory can collect 1/6 of swap fees (0.05% of 0.30%).

```bash
# Check current feeTo address (0x0 = fees disabled)
cast call $FACTORY "feeTo()(address)" --rpc-url $RPC

# Enable fees by setting feeTo to treasury
cast send $FACTORY "setFeeTo(address)" $TREASURY_ADDRESS \
    --private-key $SIGNER_KEY --rpc-url $RPC

# Disable fees
cast send $FACTORY "setFeeTo(address)" 0x0000000000000000000000000000000000000000 \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Transfer feeToSetter

```bash
# Check current feeToSetter
cast call $FACTORY "feeToSetter()(address)" --rpc-url $RPC

# Transfer to new address (e.g., upgraded multisig)
cast send $FACTORY "setFeeToSetter(address)" $NEW_OWNER \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

## RewardsDistributor Operations

### Manage Staking Pools

#### Add New Pool

```bash
# Add a new staking contract with allocation weight
# Weight determines share of weekly emissions
cast send $REWARDS_DISTRIBUTOR "addPool(address,uint256)" $NEW_STAKING_CONTRACT 500 \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

#### Update Pool Weight

```bash
# Get pool ID (usually 0 for first pool)
cast call $REWARDS_DISTRIBUTOR "poolLength()(uint256)" --rpc-url $RPC

# Update weight for pool 0
cast send $REWARDS_DISTRIBUTOR "setPoolWeight(uint256,uint256)" 0 750 \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

#### Deactivate Pool

```bash
# Deactivate pool (stops receiving rewards)
cast send $REWARDS_DISTRIBUTOR "setPoolActive(uint256,bool)" 0 false \
    --private-key $SIGNER_KEY --rpc-url $RPC

# Reactivate pool
cast send $REWARDS_DISTRIBUTOR "setPoolActive(uint256,bool)" 0 true \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Configure Emissions

```bash
# Check current weekly emission
cast call $REWARDS_DISTRIBUTOR "weeklyEmission()(uint256)" --rpc-url $RPC
# Default: 700,000 PHASOR (700000000000000000000000)

# Update weekly emission (e.g., to 500,000 PHASOR)
NEW_EMISSION="500000000000000000000000"
cast send $REWARDS_DISTRIBUTOR "setWeeklyEmission(uint256)" $NEW_EMISSION \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Manage Keepers

Keepers can trigger reward distributions.

```bash
# Check if address is keeper
cast call $REWARDS_DISTRIBUTOR "keepers(address)(bool)" $ADDRESS --rpc-url $RPC

# Add keeper
cast send $REWARDS_DISTRIBUTOR "setKeeper(address,bool)" $KEEPER_ADDRESS true \
    --private-key $SIGNER_KEY --rpc-url $RPC

# Remove keeper
cast send $REWARDS_DISTRIBUTOR "setKeeper(address,bool)" $KEEPER_ADDRESS false \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Monitor Distribution

```bash
# Check time until next distribution
cast call $REWARDS_DISTRIBUTOR "timeUntilNextDistribution()(uint256)" --rpc-url $RPC

# Check if distribution is available
cast call $REWARDS_DISTRIBUTOR "canDistribute()(bool)" --rpc-url $RPC

# Check last distribution time
cast call $REWARDS_DISTRIBUTOR "lastDistributionTime()(uint256)" --rpc-url $RPC
```

### Emergency: Recover Tokens

Recover accidentally sent tokens (except PHASOR):

```bash
cast send $REWARDS_DISTRIBUTOR "recoverERC20(address,uint256)" $TOKEN_ADDRESS $AMOUNT \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

## StakingRewards Operations

### Configure Staking Token

```bash
# Check current staking token
cast call $STAKING_REWARDS "stakingToken()(address)" --rpc-url $RPC

# Set staking token (usually LP token)
cast send $STAKING_REWARDS "setStakingToken(address)" $LP_TOKEN_ADDRESS \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

> Note: StakingRewards owner is initially the deployer. Transfer ownership to multisig if needed.

## LaunchpadFactory Operations

### Update Platform Fee

```bash
# Check current fee (basis points, 200 = 2%)
cast call $LAUNCHPAD_FACTORY "platformFeeBps()(uint256)" --rpc-url $RPC

# Update fee (max 1000 = 10%)
cast send $LAUNCHPAD_FACTORY "setPlatformFee(uint256)" 150 \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Update Fee Recipient

```bash
# Check current recipient
cast call $LAUNCHPAD_FACTORY "platformFeeRecipient()(address)" --rpc-url $RPC

# Update recipient
cast send $LAUNCHPAD_FACTORY "setPlatformFeeRecipient(address)" $NEW_RECIPIENT \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Update Default Liquidity

```bash
# Check current default (basis points, 3000 = 30%)
cast call $LAUNCHPAD_FACTORY "defaultLiquidityBps()(uint256)" --rpc-url $RPC

# Update default liquidity percentage
cast send $LAUNCHPAD_FACTORY "setDefaultLiquidityBps(uint256)" 4000 \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

### Update FairLaunch Template

If deploying an upgraded template:

```bash
# Deploy new template
NEW_TEMPLATE=$(forge create FairLaunch --rpc-url $RPC --private-key $KEY | grep "Deployed to:" | cut -d' ' -f3)

# Update factory to use new template
cast send $LAUNCHPAD_FACTORY "setFairLaunchTemplate(address)" $NEW_TEMPLATE \
    --private-key $SIGNER_KEY --rpc-url $RPC
```

## Monitoring Commands

### Protocol Health Check

```bash
echo "=== Protocol Health Check ==="

echo "Factory feeToSetter:"
cast call $FACTORY "feeToSetter()(address)" --rpc-url $RPC

echo "Total pairs:"
cast call $FACTORY "allPairsLength()(uint256)" --rpc-url $RPC

echo "RewardsDistributor owner:"
cast call $REWARDS_DISTRIBUTOR "owner()(address)" --rpc-url $RPC

echo "Total pools:"
cast call $REWARDS_DISTRIBUTOR "poolLength()(uint256)" --rpc-url $RPC

echo "Weekly emission:"
cast call $REWARDS_DISTRIBUTOR "weeklyEmission()(uint256)" --rpc-url $RPC

echo "Can distribute:"
cast call $REWARDS_DISTRIBUTOR "canDistribute()(bool)" --rpc-url $RPC

echo "LaunchpadFactory owner:"
cast call $LAUNCHPAD_FACTORY "owner()(address)" --rpc-url $RPC

echo "Total launches:"
cast call $LAUNCHPAD_FACTORY "launchCount()(uint256)" --rpc-url $RPC
```

### Pool Status

```bash
# Check pool info
POOL_ID=0
cast call $REWARDS_DISTRIBUTOR "pools(uint256)((address,uint256,bool))" $POOL_ID --rpc-url $RPC

# Get pool reward for this week
cast call $REWARDS_DISTRIBUTOR "getPoolReward(uint256)(uint256)" $POOL_ID --rpc-url $RPC
```

## Using Safe (Gnosis Safe) for Multisig

### Via Safe Web Interface

1. Go to https://app.safe.global
2. Connect with signer wallet
3. Create new transaction
4. Enter contract address
5. Use custom data (ABI encode the function call)
6. Submit and collect signatures

### Encoding Transaction Data

```bash
# Encode setWeeklyEmission call
cast calldata "setWeeklyEmission(uint256)" 500000000000000000000000

# Encode addPool call
cast calldata "addPool(address,uint256)" 0xStakingAddress 1000

# Use output as transaction data in Safe
```

### Via Safe CLI

```bash
# Install safe-cli
pip install safe-cli

# Connect to Safe
safe-cli $SAFE_ADDRESS $RPC

# Create and submit transaction
> send_custom $CONTRACT_ADDRESS 0 "functionSignature(type1,type2)" [arg1,arg2]
```

## Emergency Procedures

### Pause Operations

If critical vulnerability found:

1. **Deactivate all pools** (stops new staking rewards)
   ```bash
   cast send $REWARDS_DISTRIBUTOR "setPoolActive(uint256,bool)" 0 false
   ```

2. **Set weekly emission to 0** (stops minting)
   ```bash
   cast send $REWARDS_DISTRIBUTOR "setWeeklyEmission(uint256)" 0
   ```

3. **Update frontend** to show maintenance mode

### Transfer Ownership

If multisig is compromised:

```bash
# Transfer to new multisig (requires current multisig approval)
cast send $REWARDS_DISTRIBUTOR "transferOwnership(address)" $NEW_SAFE
cast send $LAUNCHPAD_FACTORY "transferOwnership(address)" $NEW_SAFE
cast send $FACTORY "setFeeToSetter(address)" $NEW_SAFE
```

## Best Practices

1. **Test on testnet first** before any mainnet admin operation
2. **Document all changes** in team channel
3. **Use timelock** for critical operations (consider adding)
4. **Monitor transactions** after admin operations
5. **Keep private keys secure** - use hardware wallets
6. **Have emergency contacts** ready

## Checklist for Admin Operations

Before any admin operation:

- [ ] Operation tested on testnet
- [ ] Team notified
- [ ] Correct network selected
- [ ] Parameters double-checked
- [ ] Gas price reasonable

After admin operation:

- [ ] Transaction confirmed
- [ ] State change verified
- [ ] Team notified of completion
- [ ] Documentation updated
