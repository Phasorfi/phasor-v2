# Pools Feature Guide

This document explains how the pools page works and how pool data is fetched from the blockchain.

## Overview

The pools page displays all liquidity pools created in the Phasor DEX. It fetches pool data directly from the UniswapV2Factory and UniswapV2Pair contracts.

## Architecture

### Hook: `usePools()`

Located at: [hooks/usePools.ts](hooks/usePools.ts)

This hook fetches all pools from the Factory contract in three steps:

1. **Get Pool Count**: Calls `factory.allPairsLength()` to get the total number of pools
2. **Get Pool Addresses**: Calls `factory.allPairs(index)` for each pool to get pair addresses
3. **Get Pool Data**: For each pair address, fetches:
   - `token0` - First token address
   - `token1` - Second token address
   - `getReserves()` - Current reserves (balances) of both tokens
   - `totalSupply()` - Total LP tokens minted

The hook automatically matches token addresses with metadata from the token list ([tokenlist.json](public/tokenlist.json)).

### Usage

```typescript
import { usePools } from '@/hooks';

function MyComponent() {
  const { pools, isLoading, totalPairs } = usePools();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Total pools: {totalPairs}</p>
      {pools.map((pool) => (
        <div key={pool.address}>
          {pool.token0.symbol}/{pool.token1.symbol}
        </div>
      ))}
    </div>
  );
}
```

### Return Values

- `pools: Pool[]` - Array of pool objects with full token metadata
- `isLoading: boolean` - Loading state
- `totalPairs: number` - Total number of pools from the factory

## Pool Data Structure

Each pool object contains:

```typescript
interface Pool {
  address: Address;           // Pair contract address
  token0: Token;              // First token with full metadata
  token1: Token;              // Second token with full metadata
  reserve0: bigint;           // Reserve amount of token0
  reserve1: bigint;           // Reserve amount of token1
  totalSupply: bigint;        // Total LP tokens
  fee: number;                // Fee tier (30 = 0.3%)
}

interface Token {
  address: Address;
  symbol: string;             // e.g., "TKN1"
  name: string;               // e.g., "Test Token 1"
  decimals: number;           // e.g., 18
  logoURI?: string;           // e.g., "/tokens/tkn1.svg"
  tags?: string[];            // e.g., ["test"]
}
```

## Pools Page

Located at: [app/pools/page.tsx](app/pools/page.tsx)

The pools page has two tabs:

### 1. All Pools Tab

- Displays all pools from the factory in a grid layout
- Shows pool reserves, token logos, and fee tier
- Search functionality to filter by token symbol or name
- Empty state when no pools exist

### 2. My Positions Tab

- Shows user's liquidity positions across all pools
- Requires wallet connection
- Displays LP token balances and share percentages
- Shows token amounts based on user's share
- Sorted by share percentage (highest first)
- Only shows pools where user has LP tokens (balance > 0)

## Pool Card Component

Located at: [components/pool/PoolCard.tsx](components/pool/PoolCard.tsx)

Displays:
- Token pair icons and symbols
- Fee tier (0.3%)
- TVL (Total Value Locked) - placeholder
- 24h Volume - placeholder
- Reserve amounts for both tokens
- Actions: Add Liquidity, Swap

## Search Functionality

The search filter matches against:
- Token symbols (e.g., "TKN1", "TKN2")
- Token names (e.g., "Test Token 1")
- Case-insensitive matching

```typescript
const filteredPools = pools.filter(
  (pool) =>
    pool.token0.symbol.toLowerCase().includes(search) ||
    pool.token1.symbol.toLowerCase().includes(search) ||
    pool.token0.name.toLowerCase().includes(search) ||
    pool.token1.name.toLowerCase().includes(search)
);
```

## Adding New Pools

Pools are automatically created when users add liquidity to a new token pair via:
- [Add Liquidity Page](/pools/add)
- Router's `addLiquidity()` function

The Factory contract creates a new pair contract and the pools page will automatically display it on the next load.

## Performance Considerations

### Batch Reads

The `usePools` hook uses `useReadContracts` from Wagmi to batch multiple contract reads into fewer RPC calls:

```typescript
// Single batched call instead of N individual calls
const { data: pairData } = useReadContracts({
  contracts: [
    { address: pair1, functionName: 'token0' },
    { address: pair1, functionName: 'token1' },
    { address: pair2, functionName: 'token0' },
    { address: pair2, functionName: 'token1' },
    // ... etc
  ],
});
```

### Memoization

Pool data is memoized with `useMemo` to prevent unnecessary recalculations:

```typescript
const pools = useMemo(() => {
  // Process raw contract data into Pool objects
  // Only recalculates when pairAddresses or pairData changes
}, [pairAddresses, pairData]);
```

### Automatic Refetching

Wagmi automatically refetches data when:
- User switches networks
- Block number changes (configurable)
- Window regains focus (configurable)

## Testing

Integration tests are located at: [tests/integration/pools.test.ts](tests/integration/pools.test.ts)

Run tests:
```bash
yarn test:integration
```

Tests verify:
- Factory returns correct number of pools
- Pair addresses are valid
- Pair data (tokens, reserves, totalSupply) is correct
- Token metadata matches tokenlist.json

## Troubleshooting

### Pools not showing up

1. Check that pools exist in the factory:
   ```bash
   cast call $FACTORY_ADDRESS "allPairsLength()(uint256)" --rpc-url http://127.0.0.1:8545
   ```

2. Verify pair addresses:
   ```bash
   cast call $FACTORY_ADDRESS "allPairs(uint256)(address)" 0 --rpc-url http://127.0.0.1:8545
   ```

3. Check browser console for errors
4. Verify DEFAULT_FACTORY_ADDRESS in `.env.local`

### Loading forever

- Check that Anvil is running
- Verify RPC URL in `.env.local`
- Check browser network tab for failed requests

### Token metadata missing

- Verify tokens are in `public/tokenlist.json`
- Check that token addresses match (case-insensitive)
- Fallback: Unknown tokens will show as "Token0x1234..."

## User Positions

### Hook: `useUserPositions()`

Located at: [hooks/useUserPositions.ts](hooks/useUserPositions.ts)

Fetches the connected user's liquidity positions:

1. Gets all pools using `usePools()`
2. Fetches LP token balance for each pool using `balanceOf(userAddress)`
3. Calculates:
   - Share percentage: `(userBalance / totalSupply) * 100`
   - Token0 amount: `(userBalance * reserve0) / totalSupply`
   - Token1 amount: `(userBalance * reserve1) / totalSupply`
4. Filters out pools with zero balance
5. Sorts by share percentage (descending)

### Usage

```typescript
import { useUserPositions } from '@/hooks';

function MyPositions() {
  const { positions, isLoading, hasPositions } = useUserPositions();

  if (isLoading) return <div>Loading...</div>;
  if (!hasPositions) return <div>No positions</div>;

  return (
    <div>
      {positions.map((position) => (
        <div key={position.pool.address}>
          <p>{position.pool.token0.symbol}/{position.pool.token1.symbol}</p>
          <p>Share: {position.share.toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}
```

### Return Values

- `positions: UserPosition[]` - Array of user positions
- `isLoading: boolean` - Loading state
- `hasPositions: boolean` - Whether user has any positions

## Future Enhancements

Potential improvements:

1. **Price Data**
   - Fetch token prices from oracle or DEX aggregator
   - Calculate TVL in USD
   - Show 24h volume

3. **Pool Analytics**
   - Historical price charts
   - Volume charts
   - Fee earnings

4. **Advanced Filtering**
   - Filter by TVL
   - Filter by volume
   - Filter by APR
   - Sort options

5. **Pool Creation**
   - Detect when new pools are created (events)
   - Real-time updates using WebSockets

## Related Files

- Hooks:
  - [hooks/usePools.ts](hooks/usePools.ts) - Fetch all pools
  - [hooks/useUserPositions.ts](hooks/useUserPositions.ts) - Fetch user positions
- Page: [app/pools/page.tsx](app/pools/page.tsx)
- Components:
  - [components/pool/PoolCard.tsx](components/pool/PoolCard.tsx) - Pool display
  - [components/pool/UserPositions.tsx](components/pool/UserPositions.tsx) - User positions display
- Types: [types/index.ts](types/index.ts)
- Config: [config/abis.ts](config/abis.ts)
- Tests:
  - [tests/integration/pools.test.ts](tests/integration/pools.test.ts) - Pool fetching tests
  - [tests/integration/userPositions.test.ts](tests/integration/userPositions.test.ts) - User position tests
