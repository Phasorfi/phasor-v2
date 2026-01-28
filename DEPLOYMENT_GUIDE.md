# Phasor V2 DEX - Deployment Guide

## Overview

The `deploy-interactive.sh` script is a comprehensive, interactive deployment tool that handles:
- ✅ Contract compilation and deployment (Factory, Router, WMON)
- ✅ Test token deployment (TKN1, TKN2, USDT with proper 6 decimals)
- ✅ Initial liquidity provisioning
- ✅ Configuration file updates (frontend env, tokenlist, subgraph configs)
- ✅ Optional subgraph deployment
- ✅ Deployment artifacts and verification scripts

## Prerequisites

### Required Tools
- **forge** & **cast** (Foundry) - Contract compilation and deployment
- **node** & **npx** - JavaScript tooling
- **bc** - Decimal calculations
- **jq** - JSON processing

### Optional Tools
- **gum** - Enhanced interactive menus (https://github.com/charmbracelet/gum)

### Check Prerequisites
```bash
# The script will check these automatically, but you can verify:
forge --version
cast --version
node --version
bc --version
jq --version
```

## Quick Start

### Local Deployment (Anvil)

1. **Start Anvil**:
```bash
anvil --chain-id 10143
```

2. **Run Deployment**:
```bash
./deploy-interactive.sh
```

3. **Select Options**:
   - Environment: `1` (Local)
   - Scope: `2` (Core + Tokens) or `3` (Core + Tokens + Liquidity)
   - Follow prompts...

### Testnet Deployment

1. **Prepare**:
   - Ensure you have testnet MON for gas
   - Have your private key ready (will be prompted securely)

2. **Run Deployment**:
```bash
./deploy-interactive.sh
```

3. **Select Options**:
   - Environment: `2` (Monad Testnet)
   - Scope: Choose based on needs
   - Enter private key when prompted
   - Follow prompts...

## Deployment Scopes

### 1. Core Contracts Only
- Deploys: Factory, Router
- Time: ~2-3 minutes
- Use when: You only need the core DEX contracts

### 2. Core + Test Tokens
- Deploys: Factory, Router, TKN1, TKN2, USDT
- Time: ~3-5 minutes
- Use when: You need tokens for testing but not liquidity

### 3. Core + Tokens + Liquidity
- Deploys: Factory, Router, TKN1, TKN2, USDT
- Creates: Initial liquidity pools (WMON-TKN1, WMON-TKN2, WMON-USDT)
- Time: ~5-8 minutes
- Use when: You want a ready-to-use DEX with trading pairs

### 4. Everything (Full Stack)
- Deploys: All contracts, tokens, liquidity
- Deploys: Subgraphs (local, Goldsky, or The Graph Studio)
- Time: ~10-15 minutes
- Use when: You want the complete deployment with indexing

## Test Tokens

The script automatically deploys three test tokens:

| Token | Name | Decimals | Supply |
|-------|------|----------|--------|
| TKN1 | Test Token 1 | 18 | 10^31 |
| TKN2 | Test Token 2 | 18 | 10^31 |
| USDT | Mock USD Tether | 6 | 10^31 |

**Note**: USDT uses 6 decimals to match the real USDT standard.

## Liquidity Pools

When creating liquidity, you can configure amounts for each pool:

### Default Amounts
- WMON-TKN1: 10 WMON : 10 TKN1
- WMON-TKN2: 10 WMON : 10 TKN2
- WMON-USDT: 10 WMON : 10 USDT

You can customize these amounts during the deployment process.

## Subgraph Deployment

### Option 1: Local Graph Node
- Requires Graph Node running at `http://localhost:8020`
- Ideal for local development
- Query URL: `http://localhost:8000/subgraphs/name/phasor/phasor-v2`

### Option 2: Goldsky
- Requires Goldsky API key
- Hosted indexing service
- Provide subgraph slug (e.g., `phasor-v2-testnet`)

### Option 3: The Graph Studio
- Requires Graph Studio deploy key
- Decentralized indexing
- Follow prompts for Studio URLs

## Output Files

After deployment, the script generates:

### 1. Deployment Manifest
```
deployments/deployment-{id}.json
```
Contains:
- All deployed contract addresses
- Token addresses and metadata
- Liquidity pool addresses
- Network configuration
- Subgraph URLs

### 2. Verification Script
```
deployments/verify-contracts-{id}.sh
```
Executable script to verify contracts on block explorer.

Usage:
```bash
export ETHERSCAN_API_KEY=your_key
./deployments/verify-contracts-{id}.sh
```

### 3. Build Logs
```
deployments/cannon-output-{timestamp}.log
```
Complete output from Cannon deployment for debugging.

### 4. Configuration Backups
All modified files are backed up with `.backup-{timestamp}` suffix:
- `.env.local.backup-{timestamp}`
- `tokenlist.json.backup-{timestamp}`
- `config.json.backup-{timestamp}`
- `chain.ts.backup-{timestamp}`
- `UniswapV2Library.sol.backup-{timestamp}`

## Configuration Files Updated

The script automatically updates:

### 1. Frontend Environment (`.env.local`)
```env
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_TKN1_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_TKN2_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_USDT_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEFAULT_CHAIN_ID=10143
NEXT_PUBLIC_SUBGRAPH_URL=http://localhost:8000/...
NEXT_PUBLIC_TOKENS_SUBGRAPH_URL=http://localhost:8000/...
```

### 2. Token List (`packages/phasor-dex/public/tokenlist.json`)
- Adds/updates test token entries
- Updates timestamp
- Preserves existing tokens

### 3. Subgraph Configuration
- `packages/v2-subgraph/config/{network}/config.json`
  - Factory address
  - Start block
- `packages/v2-subgraph/config/{network}/chain.ts`
  - Whitelist array (lowercase addresses)
  - Factory address
  - Reference token (WMON)

## Error Handling

### Rollback on Error
If deployment fails, the script offers to rollback configuration changes:
- Restores all backed-up files
- Clears sensitive data (private keys)
- **Note**: On-chain deployments cannot be rolled back

### Common Issues

#### 1. Anvil Connection Failed
```
❌ Cannot connect to RPC: http://127.0.0.1:8545
```
**Solution**: Ensure Anvil is running: `anvil --chain-id 10143`

#### 2. Insufficient Balance
```
⚠️ Deployer balance: 0 ETH
```
**Solution**: Fund your deployer address with testnet MON

#### 3. Graph Node Not Running
```
⚠️ Local Graph node is not running
```
**Solution**:
- Start Graph Node
- OR Skip subgraph deployment
- OR Choose different subgraph destination

#### 4. Compilation Errors
```
❌ Contract compilation failed
```
**Solution**:
- Check that all dependencies are installed: `yarn install`
- Verify Solidity version compatibility
- Check error messages in output

## Advanced Usage

### Custom Amounts for Liquidity
When prompted for pool configuration, enter custom amounts:
```
Configure WMON-USDT pool:
  WMON amount [10]: 100
  USDT amount [10]: 100
```

### Gas Configuration (Testnet/Custom)
Specify custom gas prices:
```
Enter max gas price in gwei [2.0]: 5.0
Enter max priority fee in gwei [2]: 3
```

### Environment Variables
Override defaults by setting before running:
```bash
export MAX_GAS_PRICE=5000000000  # 5 gwei
export MAX_PRIORITY_FEE=2000000000  # 2 gwei
./deploy-interactive.sh
```

## Testing the Deployment

After successful deployment:

### 1. Start Frontend
```bash
cd packages/phasor-dex
yarn dev
```

### 2. Configure Wallet
- Network: Local / Monad Testnet
- Chain ID: 10143
- RPC URL: (from deployment output)

### 3. Import Deployer Account
For local testing, import the default Anvil account:
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### 4. Test Trading
- Navigate to http://localhost:3000
- Connect wallet
- Try swapping tokens in deployed pools

## Troubleshooting

### View Deployment Details
```bash
cat deployments/deployment-{id}.json | jq
```

### Check Contract Deployment
```bash
cast code <CONTRACT_ADDRESS> --rpc-url http://127.0.0.1:8545
```

### Verify Token Balance
```bash
cast call <TOKEN_ADDRESS> "balanceOf(address)" <YOUR_ADDRESS> --rpc-url http://127.0.0.1:8545
```

### Check Pool Reserves
```bash
cast call <PAIR_ADDRESS> "getReserves()" --rpc-url http://127.0.0.1:8545
```

## Best Practices

1. **Always backup**: The script creates backups automatically, but consider manual backups for important deployments

2. **Test locally first**: Use Anvil to test the full deployment before deploying to testnet

3. **Verify contracts**: Run the verification script after deployment for transparency

4. **Document changes**: Keep track of deployment IDs and network configurations

5. **Secure private keys**: Never commit private keys to version control; use environment variables or hardware wallets

## Support

For issues or questions:
1. Check the deployment logs in `deployments/cannon-output-{timestamp}.log`
2. Review error messages carefully
3. Ensure all prerequisites are installed
4. Try the rollback feature if needed

## Next Steps

After deployment:
1. ✅ Verify contracts on block explorer
2. ✅ Test the frontend application
3. ✅ Check subgraph sync status
4. ✅ Add more liquidity if needed
5. ✅ Configure additional features (farms, staking, etc.)
