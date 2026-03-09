# Monad Testnet Integration Notes

## Historical eth_call Limitation

Monad testnet is a high-throughput blockchain that **does not support historical `eth_call` requests**. This creates challenges for subgraph indexing.

### The Problem

When a subgraph tries to index historical events on Monad:
1. It sees a past event (e.g., `PairCreated` at block 100)
2. It tries to call contract functions on that historical block to get metadata
3. Monad RPC rejects these historical calls with an error
4. The subgraph fails to index properly or skips the event

Example problematic calls:
- `pair.token0()` on block 100
- `token.symbol()` on block 100
- `token.decimals()` on block 100

### Our Solution: Hybrid Approach

We use a **hybrid data fetching strategy** that combines:

1. **Direct Contract Calls** (Primary)
   - Always queries the latest block
   - Works perfectly on Monad
   - Guarantees all pools show up
   - Implemented in `hooks/usePools.ts`

2. **Subgraph Enrichment** (Secondary)
   - Adds historical data when available
   - Provides volume, APR, TVL calculations
   - Gracefully degrades if indexing has issues
   - Implemented in `hooks/usePoolsFromSubgraph.ts`

3. **Hybrid Hook** (Combined)
   - Merges both data sources
   - Contract calls provide the base pool list
   - Subgraph data enriches with analytics
   - Implemented in `hooks/usePoolsHybrid.ts`

## Implementation Details

### usePoolsHybrid Hook

```typescript
export function usePoolsHybrid() {
  // Primary: Always fetch pools from contracts (latest block)
  const { pools: contractPools } = usePools();

  // Secondary: Try to get enrichment data from subgraph
  const { pools: subgraphPools } = usePoolsFromSubgraph();

  // Merge: Contract pools enriched with subgraph data when available
  return mergedPools;
}
```

### Data Flow

```
Frontend Request
    ↓
usePoolsHybrid
    ↓
    ├─→ usePools() ────────────────→ Monad RPC (latest block)
    │                                      ↓
    │                                Contract Calls:
    │                                - factory.allPairsLength()
    │                                - factory.allPairs(i)
    │                                - pair.token0/token1()
    │                                - pair.getReserves()
    │                                      ↓
    │                                Base Pool Data
    │                                (ALWAYS WORKS)
    │
    └─→ usePoolsFromSubgraph() ───→ Subgraph API
                                          ↓
                                    GraphQL Query
                                          ↓
                                    Enrichment Data:
                                    - tvlUSD
                                    - volume24hUSD
                                    - apr
                                    (BEST EFFORT)
                                          ↓
    Merge Results ←───────────────────────┘
    │
    ↓
Display: Base data + enrichment (when available)
```

## What Works

✅ **Pools Always Show Up**
- Direct contract calls work on latest block
- No dependency on subgraph indexing

✅ **Token Metadata**
- Falls back to `DEFAULT_TOKENS` config
- Shows symbol/name even if subgraph fails

✅ **Current Reserves**
- Real-time data from contracts
- Always accurate

✅ **User Positions**
- Calculated from LP token balances
- Works independently of subgraph

## What's Enhanced (When Subgraph Works)

🎯 **TVL (Total Value Locked)**
- Calculated from reserves × token prices
- Requires successful subgraph indexing

🎯 **24h Volume**
- Historical swap data from subgraph
- Used for APR calculations

🎯 **APR (Annual Percentage Rate)**
- Formula: `(24h volume × 0.3% fee × 365) / TVL × 100`
- Requires both volume and TVL data

🎯 **Better Token Names**
- Subgraph can fetch onchain metadata
- Falls back to DEFAULT_TOKENS if missing

## Configuration

### Environment Variables

```env
# Monad Testnet RPC
NEXT_PUBLIC_DEFAULT_RPC_URL=https://testnet-rpc.monad.xyz

# Factory contract (from deployment)
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0x29105B90E042dD07bE40ba8377ba2C72886ABa59

# Router contract (from deployment)
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0xe8512C53ADC521B3095adA3259d0F8D0f21F5c09

# Subgraph endpoint (optional - for enrichment)
NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/<ID>/phasor-v2-monad-testnet/version/latest
```

### Token List

Edit `packages/phasor-dex/public/tokenlist.json` to add tokens for your deployment:

```json
{
  "name": "Phasor Monad Testnet",
  "tokens": [
    {
      "chainId": 10143,
      "address": "0xf817257fed379853cDe0fa4F97AB987181B1E5Ea",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "logoURI": "https://..."
    }
  ]
}
```

## Troubleshooting

### Pools Not Showing

1. **Check RPC Connection**
   ```bash
   curl -X POST https://testnet-rpc.monad.xyz \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

2. **Verify Factory Address**
   - Check `.env.local` has correct `NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS`
   - Verify contract is deployed on Monad testnet

3. **Check Browser Console**
   - Look for RPC errors
   - Check if contract calls are succeeding

### Subgraph Not Enriching

This is **expected** on Monad due to historical call limitations. The app will still work, just without:
- TVL calculations
- Volume data
- APR estimates

**Solution**: Use the hybrid approach (already implemented). Pools will show with basic data.

### Token Names Showing as "Unknown"

1. **Add to DEFAULT_TOKENS**
   - Edit `config/chains.ts` or `public/tokenlist.json`
   - Add token address, symbol, name, decimals

2. **Example**:
   ```typescript
   {
     address: "0x...",
     symbol: "TOKEN",
     name: "Token Name",
     decimals: 18,
     logoURI: "https://..."
   }
   ```

## Future Considerations

### When Monad Adds Historical eth_call Support

If Monad adds support for historical `eth_call` in the future:
1. The subgraph will start indexing properly
2. The hybrid approach will automatically use enriched data
3. No code changes needed - it's already built to leverage subgraph data

### Alternative: Real-time Indexing

Could implement a custom indexer that:
- Listens to events in real-time
- Only queries latest block (no historical calls)
- Stores data in own database
- Provides API for frontend

This would be more complex but could provide full historical data on Monad.

## Related Files

- `hooks/usePools.ts` - Direct contract calls
- `hooks/usePoolsFromSubgraph.ts` - Subgraph data fetching
- `hooks/usePoolsHybrid.ts` - Hybrid combining both
- `app/pools/page.tsx` - Pools UI (uses hybrid hook)
- `config/chains.ts` - Network and token configuration
- `lib/graphql/queries.ts` - GraphQL queries for subgraph
