# Testing Guide

This document explains how to run the integration tests for the Phasor DEX frontend.

## Integration Tests

The integration tests verify that the frontend can correctly interact with the deployed smart contracts. These tests run against a local Anvil node and test real contract interactions.

### Running Tests

```bash
# Run all tests
yarn test

# Run only integration tests
yarn test:integration

# Run tests once (no watch mode)
yarn test:integration --run
```

### Test Coverage

The integration test suite currently covers:

#### Add Liquidity Tests ([tests/integration/addLiquidity.test.ts](tests/integration/addLiquidity.test.ts))

1. **Token Balance Checks** - Verifies the test account has sufficient token balances
2. **Token Approvals** - Tests approving tokens for the Router contract
3. **Add Liquidity (New Pair)** - Tests creating a new liquidity pair and adding initial liquidity
4. **Add Liquidity (Existing Pair)** - Tests adding more liquidity to an existing pair

#### Pools Tests ([tests/integration/pools.test.ts](tests/integration/pools.test.ts))

1. **Fetch Pool Count** - Verifies the Factory returns correct number of pools
2. **Fetch Pair Addresses** - Tests getting pair addresses from the Factory
3. **Fetch Pool Data** - Tests fetching token addresses, reserves, and totalSupply

#### User Positions Tests ([tests/integration/userPositions.test.ts](tests/integration/userPositions.test.ts))

1. **Fetch LP Balance** - Tests fetching user's LP token balance for a pool
2. **Calculate Share Percentage** - Verifies share calculation: `(balance / totalSupply) * 100`
3. **Calculate Token Amounts** - Tests calculating user's token amounts based on their share

### Test Configuration

Tests are configured in [vitest.config.ts](vitest.config.ts):
- Environment variables are loaded from `.env.local`
- Tests run in Node environment
- 60-second timeout for blockchain interactions

### Environment Variables

The tests automatically load contract addresses from `.env.local`:
- `DEFAULT_FACTORY_ADDRESS` - UniswapV2Factory address
- `DEFAULT_ROUTER_ADDRESS` - UniswapV2Router02 address
- `NEXT_PUBLIC_TKN1_ADDRESS` - Test token 1 address
- `NEXT_PUBLIC_TKN2_ADDRESS` - Test token 2 address
- `DEFAULT_RPC_URL` - RPC endpoint (default: http://127.0.0.1:8545)
- `DEFAULT_CHAIN_ID` - Chain ID (default: 10143)

### Prerequisites

1. **Local Node Running**: Start Anvil before running tests:
   ```bash
   anvil --chain-id 10143
   ```

2. **Contracts Deployed**: Deploy contracts using the deployment script:
   ```bash
   ./deploy.sh
   ```
   This automatically updates `.env.local` with the deployed addresses.

3. **Test Account**: The tests use Anvil's first account:
   - Address: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Test Output

When tests run successfully, you'll see output like:

```
✓ tests/integration/addLiquidity.test.ts (4 tests)
  ✓ should check token balances
  ✓ should approve tokens for Router
  ✓ should add liquidity successfully
  ✓ should add liquidity to existing pair

✓ tests/integration/pools.test.ts (3 tests)
  ✓ should fetch the number of pools from factory
  ✓ should fetch first pair address
  ✓ should fetch pair data

✓ tests/integration/userPositions.test.ts (3 tests)
  ✓ should fetch user LP token balance for a pool
  ✓ should calculate user share percentage
  ✓ should calculate user token amounts based on share

Test Files  3 passed (3)
     Tests  10 passed (10)
```

### Adding More Tests

To add more integration tests:

1. Create a new test file in `tests/integration/`
2. Import the necessary ABIs and utilities
3. Use `createPublicClient` and `createWalletClient` from Viem
4. Access contract addresses from `CONTRACTS` or environment variables
5. Follow the same pattern as [addLiquidity.test.ts](tests/integration/addLiquidity.test.ts)

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { createPublicClient, createWalletClient, http } from 'viem';
import { CONTRACTS } from '@/config/chains';

describe('My Test Suite', () => {
  const publicClient = createPublicClient({
    transport: http(process.env.DEFAULT_RPC_URL || 'http://127.0.0.1:8545'),
  });

  it('should test something', async () => {
    // Your test logic here
  });
});
```

### Troubleshooting

**Tests failing with "undefined" addresses:**
- Make sure `.env.local` exists and contains the contract addresses
- Run `./deploy.sh` to deploy contracts and generate `.env.local`

**Tests timing out:**
- Check that Anvil is running on the correct port
- Verify the RPC URL in `.env.local` matches your Anvil instance

**"Insufficient balance" errors:**
- The test account receives tokens during deployment
- If you restart Anvil, you need to redeploy with `./deploy.sh`

**Contract reverts:**
- Check that the INIT_CODE_HASH is correct in UniswapV2Library.sol
- Re-run `./deploy.sh` to recalculate and update the hash

## Future Test Coverage

Additional tests to consider adding:

- **Remove Liquidity** - Test removing liquidity from a pair
- **Token Swaps** - Test swapping tokens through the router
- **Price Calculations** - Test getting quotes and price impacts
- **Multi-hop Swaps** - Test swaps through multiple pairs
- **Slippage Protection** - Test minimum amount parameters
- **Pool Queries** - Test reading pair reserves and LP token balances
