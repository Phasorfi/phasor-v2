# Production Deployment Guide

This guide covers deploying Phasor V2 to Monad mainnet for production use.

> **Warning**: Production deployments are irreversible. Follow this guide carefully and ensure all prerequisites are met before proceeding.

## Pre-Launch Checklist

### Security Review

- [ ] Smart contracts audited by reputable firm
- [ ] Audit findings addressed and verified
- [ ] Internal security review completed
- [ ] Bug bounty program set up

### Multisig Setup

- [ ] Safe multisig deployed on mainnet
- [ ] Appropriate signers added (3/5 or similar)
- [ ] All signers have tested transaction signing
- [ ] Hardware wallets recommended for all signers
- [ ] Backup signers identified

### Infrastructure

- [ ] Premium RPC endpoint configured (not public RPC)
- [ ] Block explorer API key obtained
- [ ] Monitoring and alerting set up
- [ ] Emergency response procedures documented

### Testing

- [ ] Full deployment tested on testnet
- [ ] All functionality verified on testnet
- [ ] Ownership transfers verified on testnet
- [ ] Subgraph indexing working on testnet

### Documentation

- [ ] User documentation complete
- [ ] Admin procedures documented
- [ ] Emergency procedures documented
- [ ] Team has access to all documentation

## Pre-Deployment Setup

### 1. Configure Production Addresses

Create or copy the cannonfile for production:

```bash
cp cannonfile.toml cannonfile.production.toml
```

Edit `cannonfile.production.toml`:

```toml
name = "phasor-v2"
version = "<%= package.version %>"
description = "Native DEX for Monad"

[var.main]
# PRODUCTION ADDRESSES - VERIFY CAREFULLY
deployer = "0xProductionDeployerAddress"
safe = "0xProductionMultisigAddress"
WMON = "0xProductionWMONAddress"
```

### 2. Configure Environment

```bash
# Use production RPC (premium endpoint recommended)
export RPC_URL="https://your-premium-rpc.monad.xyz"
export CHAIN_ID="<MAINNET_CHAIN_ID>"

# Set conservative gas limits
export MAX_GAS_PRICE="100"

# Deployer key (use hardware wallet if possible)
export DEPLOYER_PRIVATE_KEY="0x..."

# Use production cannonfile
export CANNONFILE="cannonfile.production.toml"
```

### 3. Pre-Fund Deployer

1. Calculate exact gas needed (run `./deploy-testnet.sh` with dry-run)
2. Add 50% buffer for safety
3. Transfer exact amount to deployer (minimize exposure)

## Deployment Procedure

### Step 1: Final Review

Before running deployment:

```bash
# Verify cannonfile addresses
cat cannonfile.production.toml | grep -A 5 "[var.main]"

# Verify RPC is pointing to mainnet
cast chain-id --rpc-url $RPC_URL

# Verify deployer balance
cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL
```

### Step 2: Team Confirmation

Get explicit confirmation from:
- [ ] Technical lead
- [ ] Security lead
- [ ] At least one multisig signer

### Step 3: Deploy

```bash
# Run with production cannonfile
CANNONFILE=cannonfile.production.toml ./deploy-testnet.sh
```

Monitor the deployment carefully. The script will:
1. Perform all pre-flight checks
2. Show gas estimates
3. Request confirmation
4. Deploy all contracts
5. Transfer ownership to multisig
6. Verify ownership transfers

### Step 4: Immediate Verification

```bash
RPC="$RPC_URL"

# Verify all contract code is deployed
for addr in $FACTORY $ROUTER $PHASOR_TOKEN $VOTING_ESCROW $REWARDS_DISTRIBUTOR $STAKING_REWARDS $LAUNCHPAD_FACTORY; do
    code=$(cast code $addr --rpc-url $RPC)
    if [ "$code" = "0x" ]; then
        echo "ERROR: No code at $addr"
    else
        echo "OK: Code deployed at $addr"
    fi
done

# Verify ownership
cast call $FACTORY "feeToSetter()(address)" --rpc-url $RPC
cast call $REWARDS_DISTRIBUTOR "owner()(address)" --rpc-url $RPC
cast call $PHASOR_TOKEN "owner()(address)" --rpc-url $RPC
cast call $LAUNCHPAD_FACTORY "owner()(address)" --rpc-url $RPC
```

### Step 5: Contract Verification

Verify all contracts on block explorer immediately:

```bash
# UniswapV2Factory
forge verify-contract $FACTORY_ADDRESS \
    packages/core/contracts/UniswapV2Factory.sol:UniswapV2Factory \
    --chain-id $CHAIN_ID \
    --constructor-args $(cast abi-encode "constructor(address)" $DEPLOYER_ADDRESS)

# UniswapV2Router02
forge verify-contract $ROUTER_ADDRESS \
    UniswapV2Router02 \
    --chain-id $CHAIN_ID \
    --constructor-args $(cast abi-encode "constructor(address,address)" $FACTORY_ADDRESS $WMON_ADDRESS)

# Continue for all contracts...
```

### Step 6: Secure Deployer

After successful deployment:

```bash
# Transfer remaining balance from deployer to treasury
cast send $TREASURY_ADDRESS \
    --value $(cast balance $DEPLOYER_ADDRESS --rpc-url $RPC) \
    --private-key $DEPLOYER_PRIVATE_KEY \
    --rpc-url $RPC

# Verify deployer is empty
cast balance $DEPLOYER_ADDRESS --rpc-url $RPC
```

Clear environment:

```bash
unset DEPLOYER_PRIVATE_KEY
```

## Post-Deployment

### 1. Save Deployment Records

Store securely:
- `deployments/deployment-{timestamp}.json`
- Transaction hashes for all deployments
- Block numbers for each contract

### 2. Update Documentation

- Update CLAUDE.md with production addresses
- Update frontend .env.production
- Update subgraph configuration

### 3. Multisig Configuration

Via multisig:
1. Set staking token
2. Add staking pool to RewardsDistributor
3. Configure keepers

### 4. Subgraph Deployment

```bash
cd packages/v2-subgraph

# Update config for mainnet
# Edit config/monad/config.json with factory address and startBlock

yarn build --network monad --subgraph-type v2
# Deploy to The Graph Studio or Goldsky
```

### 5. Frontend Deployment

```bash
# Update production environment
cp packages/phasor-dex/.env.local packages/phasor-dex/.env.production

# Verify all addresses
cat packages/phasor-dex/.env.production

# Deploy frontend
# (your deployment process)
```

## Emergency Procedures

### If Deployment Fails Mid-Way

1. **DO NOT PANIC**
2. Check Cannon logs for exact failure point
3. Partially deployed contracts cannot be changed
4. May need to redeploy remaining contracts manually
5. Document everything that happened

### If Ownership Transfer Fails

1. Check which transfers succeeded/failed
2. Manually call remaining transfers via deployer
3. Verify all ownership before clearing deployer key

### If Wrong Address Received Ownership

1. If deployer still has ownership, transfer to correct address
2. If wrong multisig, coordinate with that multisig
3. If wrong EOA, contact that address owner immediately

### Rollback

> **Note**: Blockchain deployments cannot be rolled back. You can only:
> 1. Deploy new contracts
> 2. Update frontend to point to new contracts
> 3. Leave old contracts unused

## Security Reminders

1. **Never commit private keys** to git
2. **Use hardware wallets** for production signers
3. **Monitor contracts** for unexpected activity
4. **Have emergency contacts** ready
5. **Document everything** as you go

## Post-Launch Monitoring

Set up monitoring for:
- Large swaps or liquidity changes
- Ownership transfer attempts
- Unusual transaction patterns
- Gas price spikes
- RPC availability

## Support Contacts

For emergency support:
- Technical Lead: [contact]
- Security Lead: [contact]
- Multisig Signers: [contacts]
