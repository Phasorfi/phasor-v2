# Phasor V2 Deployment Guide

This guide explains how to deploy the Phasor V2 DEX contracts using the automated deployment script.

## Quick Start

The easiest way to deploy is to use the automated script:

```bash
./deploy.sh
```

This will:
1. Compile all contracts
2. Calculate the correct INIT_CODE_HASH
3. Update UniswapV2Library.sol with the hash
4. Deploy all contracts via Cannon
5. Automatically update the frontend `.env.local` with the new addresses

## Custom Configuration

You can customize the deployment with environment variables:

```bash
# Deploy to a different RPC
RPC_URL=https://your-rpc.com ./deploy.sh

# Deploy to a different chain
CHAIN_ID=1 RPC_URL=https://mainnet.com ./deploy.sh
```

## What Gets Deployed

The script deploys:
- **UniswapV2Factory** - Creates trading pairs
- **UniswapV2Router02** - Routes swaps and manages liquidity
- **TKN1** - Test token 1 (ERC20 with 100,000,000,000,000 supply)
- **TKN2** - Test token 2 (ERC20 with 100,000,000,000,000 supply)

## Frontend Integration

After deployment, the script automatically updates `packages/phasor-dex/.env.local` with:

```env
DEFAULT_FACTORY_ADDRESS=0x...
DEFAULT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_TKN1_ADDRESS=0x...
NEXT_PUBLIC_TKN2_ADDRESS=0x...
DEFAULT_RPC_URL=http://127.0.0.1:8545
DEFAULT_CHAIN_ID=10143
```

The frontend is configured to read these values in `packages/phasor-dex/config/chains.ts`.

## Manual Deployment

If you prefer to deploy manually:

### 1. Compile Contracts

```bash
forge build packages/ --force
```

### 2. Calculate INIT_CODE_HASH

```bash
npx ts-node script/calculateInitHash.ts
```

This outputs the hash you need to add to UniswapV2Library.sol.

### 3. Update UniswapV2Library.sol

Edit `packages/periphery/contracts/libraries/UniswapV2Library.sol` and replace the hex value on line 24:

```solidity
hex'YOUR_HASH_HERE' // init code hash
```

### 4. Recompile

```bash
forge build packages/ --force
```

### 5. Deploy with Cannon

```bash
npx @usecannon/cli build --rpc-url http://127.0.0.1:8545 --chain-id 10143 --wipe
```

### 6. Update Frontend

Copy the deployed addresses to `packages/phasor-dex/.env.local`:

```env
DEFAULT_FACTORY_ADDRESS=<factory-address>
DEFAULT_ROUTER_ADDRESS=<router-address>
NEXT_PUBLIC_TKN1_ADDRESS=<tkn1-address>
NEXT_PUBLIC_TKN2_ADDRESS=<tkn2-address>
```

## Testing the Deployment

After deployment, test adding liquidity with cast:

```bash
# Approve tokens
cast send <TKN1_ADDRESS> "approve(address,uint256)(bool)" <ROUTER_ADDRESS> 10000000000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545

cast send <TKN2_ADDRESS> "approve(address,uint256)(bool)" <ROUTER_ADDRESS> 10000000000000000000000000 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545

# Add liquidity
cast send <ROUTER_ADDRESS> "addLiquidity(address,address,uint256,uint256,uint256,uint256,address,uint256)" \
  <TKN1_ADDRESS> <TKN2_ADDRESS> 10000000000000 10000000000000 0 0 \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 9999999999 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --rpc-url http://127.0.0.1:8545 \
  --gas-limit 5000000
```

## Troubleshooting

### "execution reverted 0x" Error

This usually means the INIT_CODE_HASH is incorrect. The hash must match the bytecode of the UniswapV2Pair contract exactly.

**Solution:** Re-run `./deploy.sh` which will recalculate the correct hash.

### "Insufficient balance" Error

The test tokens have a limited supply. Make sure you're using small amounts (e.g., 10000000000000 = 0.00001 tokens).

### Frontend Not Picking Up New Addresses

1. Make sure `.env.local` exists in `packages/phasor-dex/`
2. Restart your Next.js dev server
3. Clear your browser cache

## Important Notes

- The INIT_CODE_HASH **must** be recalculated every time you change:
  - Solidity compiler version
  - Optimizer settings
  - UniswapV2Pair contract code

- The deployment script uses Foundry's optimizer with 99,999 runs (set in `foundry.toml`)

- Default test account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (Anvil's first account)

## File Locations

- Deployment script: `./deploy.sh`
- Init hash calculator: `script/calculateInitHash.ts`
- Cannon config: `cannonfile.toml`
- Frontend config: `packages/phasor-dex/config/chains.ts`
- Token list: `packages/phasor-dex/public/tokenlist.json`
- Library to update: `packages/periphery/contracts/libraries/UniswapV2Library.sol`

## Managing Tokens

The DEX uses the Token Lists standard. To add new tokens, simply edit `packages/phasor-dex/public/tokenlist.json`.

See [TOKEN_LIST.md](packages/phasor-dex/TOKEN_LIST.md) for detailed instructions on:
- Adding new tokens
- Using token tags
- Multi-chain support
- Token logo management
