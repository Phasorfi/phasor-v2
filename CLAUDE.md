<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors

<!-- nx configuration end-->

---

# Phasor DEX - Project Documentation

## Project Overview

Phasor DEX is a decentralized exchange built on Monad testnet, featuring:
- Uniswap V2-style AMM with liquidity pools
- Portfolio tracking with historical charts
- Real-time swap interface
- Liquidity provision (add/remove)
- Graph Protocol subgraph for historical data indexing

## Architecture

### Frontend (`packages/phasor-dex`)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + wagmi for Web3
- **Data Fetching**: Apollo Client for GraphQL (subgraph queries)

### Smart Contracts (`packages/core`)
- **Factory**: `UniswapV2Factory` - Creates new trading pairs
- **Router**: `UniswapV2Router02` - Handles swaps and liquidity
- **Pairs**: `UniswapV2Pair` - Individual AMM pools
- **Deployment**: Cannon for deterministic deployments

### Subgraph (`packages/v2-subgraph`)
- **Platform**: The Graph Protocol
- **Network**: Local Graph Node for development, Monad testnet for production
- **Entities**: Pairs, Tokens, Swaps, Mints, Burns, hourly/daily aggregations

## Critical Implementation Details

### 1. Subgraph Configuration

**Important**: There is only ONE subgraph deployed: `phasor-v2`

The codebase previously referenced a separate `v2-tokens` subgraph, but this does **not exist**. All data (pairs, tokens, swaps, price history) is in the main `phasor-v2` subgraph.

**Apollo Client Setup** (`packages/phasor-dex/lib/apollo-client.ts`):
```typescript
// ✅ CORRECT - Use apolloClient for ALL queries
const apolloClient = new ApolloClient({
  link: httpLink, // Points to phasor-v2 subgraph
  // ...
});

// ❌ DEPRECATED - tokensApolloClient should NOT be used
// All price data exists in the main phasor-v2 subgraph
```

**All GraphQL queries must use `apolloClient`**, not `tokensApolloClient`:
- `usePortfolioHistory` - Uses main subgraph for `tokenDayDatas`
- `useTokenPrices` - Uses main subgraph for current prices
- `usePoolChartData` - Uses main subgraph for `pairHourDatas` and `pairDayDatas`
- `usePoolDetail` - Uses main subgraph for pair data
- `PoolDetailTransactions` - Uses main subgraph for swaps/mints/burns

### 2. Portfolio Page Implementation

**Location**: `packages/phasor-dex/app/portfolio/page.tsx`

**Key Features**:
- Overview tab: Portfolio value chart and stats
- Tokens tab: Token holdings with prices and allocations
- Activity tab: Transaction history (mints/burns)

**Important Fixes Applied**:

1. **Portfolio History Hook** (`hooks/usePortfolioHistory.ts`):
   - Fixed to fetch data even when user has LP positions but no current token balances
   - Uses `apolloClient` (not `tokensApolloClient`)
   - Lowercase address normalization for consistent lookups
   - Query is not skipped if user has positions: `shouldFetch = userAddress && (allTokenAddresses.length > 0 || positions.length > 0)`

2. **Token Prices Hook** (`hooks/useTokenPrices.ts`):
   - Changed from `tokensApolloClient` to `apolloClient`
   - Queries `tokenDayDatas` from main subgraph

3. **Address Case Sensitivity**:
   - All addresses must be lowercased before GraphQL queries and map lookups
   - Subgraph stores addresses in lowercase
   - Frontend must normalize addresses consistently

### 3. Pool Detail Pages

**Location**: `packages/phasor-dex/app/pools/[address]/page.tsx`

**Components**:
1. **PoolDetailHeader** - Token pair info, price, volume
2. **PoolDetailStats** - TVL, 24h volume, fees, APR
3. **PoolDetailChart** - Liquidity & volume chart (hourly/daily)
4. **PoolDetailTransactions** - Recent swaps, mints, burns

**Critical Fixes**:

1. **Chart Data** (`hooks/usePoolChartData.ts`):
   - Uses `apolloClient` for both hourly and daily data
   - Queries `pairHourDatas` for 1D period
   - Queries `pairDayDatas` for 1W/1M/ALL periods
   - Both exist at root level in subgraph (not nested under Pair)

2. **Transaction History** (`components/pool/PoolDetailTransactions.tsx`):
   - **Apollo Cache Fix**: Must include `id` fields for all entities (Pair, Token0, Token1)
   - Apollo Client requires `id` as keyField (defined in `apollo-client.ts`)
   - Query structure:
     ```graphql
     pair {
       id  # ← Required!
       token0 {
         id      # ← Required!
         symbol
       }
       token1 {
         id      # ← Required!
         symbol
       }
     }
     ```

3. **Chart Styling**:
   - Height: `h-[350px] md:h-[400px]` (better than `h-64`)
   - Margins: `{ top: 10, right: 30, left: 10, bottom: 0 }`
   - Y-axis width: `60px` for consistent label space
   - Bar radius: `[4, 4, 0, 0]` for rounded top corners
   - Grid: `vertical={false}` for cleaner appearance

### 4. Local Development Setup

**Running Anvil with Historical Data**:
```bash
anvil --host 0.0.0.0 --chain-id 10143 --timestamp <past_timestamp> --balance 100000
```

**Important Addresses**:
- Default test account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Subgraph URLs**:
- Local: `http://localhost:8000/subgraphs/name/phasor-v2`
- GraphQL endpoint for queries

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/phasor-v2
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=http://127.0.0.1:8545
```

### 5. Subgraph Network Configurations

The subgraph has separate configurations for different environments:

**Configuration Structure** (`packages/v2-subgraph/config/`):
```
config/
├── local/           # For local Anvil development (updated by deploy script)
│   ├── config.json  # Factory address, startBlock
│   ├── chain.ts     # Token addresses, pair addresses
│   └── .subgraph-env
├── monad-testnet/   # For Monad testnet (static, real addresses)
│   ├── config.json
│   ├── chain.ts
│   └── .subgraph-env
└── monad/           # For Monad mainnet (future)
```

**Important**: The `local` config files are overwritten by `deploy-local-full.sh`. Never commit local addresses to `monad-testnet` config.

**Why both have `network: monad-testnet`**: The graph-node's ethereum setting uses `monad-testnet` as the network name. The subgraph manifest must match this. The difference is only in the contract addresses.

### 6. Common Issues and Solutions

**Issue**: Graph-node shows "chain is defective" error
- **Cause**: Anvil was restarted and got a new genesis hash, but graph-node database has old chain state
- **Fix**: The deploy script now automatically wipes `data/postgres` and `data/ipfs` before starting graph-node

**Issue**: Portfolio charts not showing data
- **Cause**: Using wrong Apollo client or no LP positions detected
- **Fix**: Ensure `apolloClient` is used and query is not skipped when positions exist

**Issue**: "Missing field 'id' while extracting keyFields"
- **Cause**: GraphQL queries missing `id` field for entities
- **Fix**: Include `id` field for all entities (Pair, Token, etc.) that have keyFields defined in Apollo cache

**Issue**: Pool charts showing "No historical data available"
- **Cause**: Query filters or wrong subgraph endpoint
- **Fix**: Verify query uses correct field names (`pairAddress` not `pair`) and `apolloClient`

**Issue**: Addresses not matching in lookups
- **Cause**: Inconsistent address casing (checksummed vs lowercase)
- **Fix**: Normalize all addresses to lowercase before queries and Map lookups

### 7. Data Flow Architecture

```
User Action (Swap/Add Liquidity)
  ↓
Smart Contract Event Emitted
  ↓
Graph Node Indexes Event
  ↓
Subgraph Updates Entities (Pair, Token, Swap, etc.)
  ↓
Frontend Queries via Apollo Client
  ↓
React Hooks Process Data
  ↓
UI Components Display Results
```

**Entity Relationships**:
- `Pair` → has `token0` and `token1` (many-to-one)
- `Swap/Mint/Burn` → references `pair` (many-to-one)
- `PairDayData/PairHourData` → aggregates by time period
- `TokenDayData` → tracks token prices over time

### 8. Testing Checklist

When making changes, verify:
- [ ] Portfolio page loads with test account connected
- [ ] Portfolio charts display historical data (if LP positions exist)
- [ ] Pool detail page shows liquidity & volume chart
- [ ] Pool transactions list displays swaps/mints/burns
- [ ] No Apollo cache errors in console
- [ ] All addresses are lowercase in GraphQL queries
- [ ] Queries use `apolloClient` (not `tokensApolloClient`)

### 9. Future Enhancements (See dex-plan.md)

The `dex-plan.md` file contains a comprehensive 2-week sprint plan for:
- PHASOR token (ERC20 with permit)
- MasterChef farming (SushiSwap V2 fork)
- Merkle airdrop
- Launchpad (Fair launch, LBP, Tiered sales)
- xPHASOR staking

Refer to that document for implementation details when building these features.

---

## Development Workflow

1. **Start local blockchain**: `anvil --host 0.0.0.0 --chain-id 10143`
2. **Deploy contracts**: `./deploy-local-full.sh`
3. **Start Graph Node**: Docker compose in `packages/v2-subgraph`
4. **Deploy subgraph**: Scripts in `packages/v2-subgraph/scripts`
5. **Start frontend**: `cd packages/phasor-dex && npm run dev`
6. **Connect wallet**: Use test account with MetaMask

## Code Style Guidelines

- Use TypeScript for all new code
- Follow existing patterns in hooks (see `useSwap.ts` as reference)
- Use shadcn/ui components for UI consistency
- Prefer Apollo Client hooks over manual fetch for GraphQL
- Always lowercase addresses before subgraph queries
- Include proper loading and error states in components

## Problem-Solving Guidelines

**IMPORTANT: Research before patching**

When facing build errors, configuration issues, or tooling problems:

1. **DO NOT assume or patch** - Don't try workarounds like skipping files, ignoring errors, or disabling features to make things "work" temporarily
2. **Research first** - Use web search to find the proper solution. Most tools have documented ways to handle edge cases
3. **Ask for references** - If you need documentation links or aren't sure where to look, ask the user
4. **Understand the root cause** - Before implementing any fix, understand WHY the issue is happening

**Example**: Foundry compilation errors with multiple Solidity versions
- ❌ Wrong: Using `skip` or `ignore` to exclude problematic files
- ✅ Right: Using `compilation_restrictions` to force correct compiler version per path (documented in Foundry's official docs)

The goal is to fix issues properly, not to make errors disappear temporarily.