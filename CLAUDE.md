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
- **Velodrome V2 AMM** with stable and volatile liquidity pools
- **ve(3,3) tokenomics** with voting escrow and gauge voting
- Portfolio tracking with historical charts
- Real-time swap interface
- Liquidity provision (add/remove)
- **VelodromeLauncher** for token sales with automatic LP creation and gauge staking
- Graph Protocol subgraph for historical data indexing

## Architecture

### Frontend (`packages/phasor-dex`)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React hooks + wagmi for Web3
- **Data Fetching**: Apollo Client for GraphQL (subgraph queries)

### Smart Contracts (`packages/velodrome-fork`)
- **PoolFactory**: Creates new trading pools (stable or volatile)
- **Pool**: Individual AMM pools (supports stable and volatile pricing curves)
- **Router**: Handles swaps and liquidity operations
- **VotingEscrow**: ve(3,3) lock mechanism for PHASOR tokens
- **Voter**: Gauge voting and emissions distribution
- **Gauge**: Liquidity mining rewards
- **VelodromeLauncher**: Token sale launchpad with automatic LP + Gauge creation
- **Deployment**: Cannon for deterministic deployments

### Subgraph (`packages/velodrome-subgraph`)
- **Platform**: The Graph Protocol
- **Network**: Local Graph Node for development, Monad testnet for production
- **Entities**: Pairs, Tokens, Swaps, Mints, Burns, hourly/daily aggregations

## Critical Implementation Details

### 1. Subgraph Configuration

**Important**: The subgraph uses Velodrome-style event signatures with `bool stable` parameter.

**Apollo Client Setup** (`packages/phasor-dex/lib/apollo-client.ts`):
```typescript
// Use apolloClient for ALL queries
const apolloClient = new ApolloClient({
  link: httpLink, // Points to velodrome subgraph
  // ...
});
```

**GraphQL Queries** (`packages/phasor-dex/lib/graphql/queries.ts`):
- Uses `pairs` / `pair` entity names (compatible with Velodrome schema)
- Added `isStable` field to PAIR_FIELDS fragment
- `GET_PROTOCOL_DATA` uses `factory` entity (not `uniswapFactory`)

### 2. VelodromeLauncher Contract

**Location**: `packages/velodrome-fork/contracts/launchpad/VelodromeLauncher.sol`

**Features**:
- Fixed-rate token sales with soft/hard caps
- Ve-gating: requires ownership of veNFT to participate
- Automatic liquidity creation via Velodrome Router
- Automatic gauge creation and LP staking
- LP receipt tokens sent to locker for vesting

**Key Functions**:
```solidity
createSale(token, baseToken, tokenAmount, price, softCap, hardCap, startTime, endTime)
contribute(saleId, amount)  // ve-gated
finalizeAndLaunch(saleId, liquidityPercent)  // Creates LP, gauge, stakes LP
claim(saleId)  // Users claim tokens after finalization
refund(saleId)  // If cancelled or soft cap not reached
```

### 3. Pool Types

Velodrome supports two pool types:
- **Volatile pools** (`stable = false`): Standard x*y=k curve
- **Stable pools** (`stable = true`): Optimized for like-kind assets (stablecoins)

### 4. Local Development Setup

**Running Anvil with Historical Data**:
```bash
anvil --host 0.0.0.0 --chain-id 10143 --timestamp <past_timestamp> --balance 100000
```

**Important Addresses**:
- Default test account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- Private key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

**Subgraph URLs**:
- Local: `http://localhost:8000/subgraphs/name/velodrome-subgraph`
- GraphQL endpoint for queries

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/velodrome-subgraph
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=http://127.0.0.1:8545
```

### 5. Subgraph Network Configurations

**Configuration Structure** (`packages/velodrome-subgraph/config/`):
```
config/
├── local/           # For local Anvil development
│   └── config.json  # Factory address, startBlock, network
└── monad-testnet/   # For Monad testnet
    └── config.json
```

### 6. Common Issues and Solutions

**Issue**: Graph-node shows "chain is defective" error
- **Cause**: Anvil was restarted and got a new genesis hash
- **Fix**: Wipe `data/postgres` and `data/ipfs` before starting graph-node

**Issue**: "Missing field 'id' while extracting keyFields"
- **Cause**: GraphQL queries missing `id` field for entities
- **Fix**: Include `id` field for all entities (Pair, Token, etc.)

**Issue**: Addresses not matching in lookups
- **Cause**: Inconsistent address casing
- **Fix**: Normalize all addresses to lowercase before queries

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
- `Pair` → has `token0`, `token1`, and `isStable` (many-to-one)
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

---

## Package Structure

```
packages/
├── velodrome-fork/          # Velodrome V2 smart contracts
│   ├── contracts/
│   │   ├── Pool.sol         # AMM pool implementation
│   │   ├── Router.sol       # Swap and liquidity router
│   │   ├── VotingEscrow.sol # ve(3,3) lock mechanism
│   │   ├── Voter.sol        # Gauge voting
│   │   ├── Gauge.sol        # Liquidity mining
│   │   ├── Phasor.sol       # PHASOR token
│   │   ├── launchpad/       # VelodromeLauncher
│   │   └── test/            # Mock tokens (USDC, USDT, WBTC, etc.)
├── velodrome-subgraph/      # The Graph subgraph
└── phasor-dex/              # Next.js frontend
```

## Development Workflow

1. **Start local blockchain**: `anvil --host 0.0.0.0 --chain-id 10143`
2. **Deploy contracts**: `./deploy-local-full.sh`
3. **Start Graph Node**: Docker compose in `packages/velodrome-subgraph`
4. **Deploy subgraph**: Scripts in `packages/velodrome-subgraph`
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

The goal is to fix issues properly, not to make errors disappear temporarily.
