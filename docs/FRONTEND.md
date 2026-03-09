# Frontend Documentation

## Overview

The frontend is a Next.js 14 application using App Router, located in `packages/phasor-dex`.

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Web3 | wagmi v2, viem, RainbowKit |
| GraphQL | Apollo Client |
| State | Zustand (local), React Query (server) |
| Charts | Recharts |

## Directory Structure

```
packages/phasor-dex/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Landing page
│   ├── swap/page.tsx       # Swap interface
│   ├── pools/
│   │   ├── page.tsx        # Pool listing
│   │   ├── add/page.tsx    # Add liquidity
│   │   ├── remove/page.tsx # Remove liquidity
│   │   └── [address]/page.tsx  # Pool detail
│   └── portfolio/page.tsx  # User portfolio
├── components/             # React components
│   ├── ui/                 # shadcn/ui primitives
│   ├── swap/               # Swap-related components
│   ├── pool/               # Pool-related components
│   └── portfolio/          # Portfolio components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities and config
│   ├── apollo-client.ts    # GraphQL client setup
│   ├── wagmi.ts            # wagmi configuration
│   └── utils.ts            # Helper functions
├── graphql/                # GraphQL queries
└── types/                  # TypeScript types
```

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `app/page.tsx` | Landing/home page |
| `/swap` | `app/swap/page.tsx` | Token swap interface |
| `/pools` | `app/pools/page.tsx` | List all liquidity pools |
| `/pools/add` | `app/pools/add/page.tsx` | Add liquidity form |
| `/pools/remove` | `app/pools/remove/page.tsx` | Remove liquidity form |
| `/pools/[address]` | `app/pools/[address]/page.tsx` | Pool detail with charts |
| `/portfolio` | `app/portfolio/page.tsx` | User portfolio dashboard |

## Custom Hooks

### Swap Hooks

| Hook | Purpose |
|------|---------|
| `useSwap` | Execute token swaps via Router |
| `usePair` | Get pair reserves and pricing |

### Pool Hooks

| Hook | Purpose |
|------|---------|
| `usePools` | List all pools (on-chain) |
| `usePoolsFromSubgraph` | List pools with TVL/volume (subgraph) |
| `usePoolsHybrid` | Combined on-chain + subgraph data |
| `usePoolDetail` | Single pool with full details |
| `usePoolChartData` | Historical chart data (hourly/daily) |
| `useAddLiquidity` | Add liquidity transaction |

### Portfolio Hooks

| Hook | Purpose |
|------|---------|
| `useUserPositions` | User's LP positions (on-chain) |
| `useUserPositionsFromSubgraph` | LP positions with USD values |
| `usePortfolioValue` | Total portfolio value calculation |
| `usePortfolioHistory` | Historical portfolio value chart |
| `usePortfolioTokens` | Token holdings breakdown |
| `useUserTransactions` | User's swap/mint/burn history |

### Utility Hooks

| Hook | Purpose |
|------|---------|
| `useTokenBalance` | ERC20 balance for address |
| `useTokenPrices` | Token prices from subgraph |
| `useImportToken` | Import custom tokens |

## Apollo Client Setup

**Important**: There is only ONE subgraph (`phasor-v2`). Use `apolloClient` for all queries.

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_SUBGRAPH_URL,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          pairs: { merge: false },
          tokens: { merge: false },
        },
      },
    },
  }),
});
```

**Critical**: Always include `id` field in GraphQL queries for entities with keyFields defined:

```graphql
# Correct
query GetPair($id: ID!) {
  pair(id: $id) {
    id  # Required!
    token0 {
      id  # Required!
      symbol
    }
    token1 {
      id  # Required!
      symbol
    }
  }
}
```

## wagmi Configuration

```typescript
// lib/wagmi.ts
import { createConfig, http } from 'wagmi';
import { monadTestnet } from './chains';

export const config = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_DEFAULT_RPC_URL),
  },
});
```

## Common Patterns

### Address Normalization

Always lowercase addresses before subgraph queries:

```typescript
const normalizedAddress = address.toLowerCase();
const { data } = useQuery(GET_TOKEN, {
  variables: { id: normalizedAddress },
});
```

### Loading States

```typescript
function PoolList() {
  const { data, loading, error } = usePools();

  if (loading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;
  if (!data?.length) return <EmptyState />;

  return <PoolTable pools={data} />;
}
```

### Transaction Flow

```typescript
function SwapButton() {
  const { writeContract, isPending, isSuccess, error } = useSwap();

  const handleSwap = async () => {
    await writeContract({
      // ... swap params
    });
  };

  return (
    <Button
      onClick={handleSwap}
      disabled={isPending}
    >
      {isPending ? 'Swapping...' : 'Swap'}
    </Button>
  );
}
```

## Environment Variables

Create `.env.local` in `packages/phasor-dex`:

```bash
# Chain Configuration
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=http://127.0.0.1:8545

# Core Contracts
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=0x...

# PHASOR Ecosystem
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_MASTERCHEF_ADDRESS=0x...
NEXT_PUBLIC_LAUNCHPAD_FACTORY_ADDRESS=0x...

# Subgraph
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/phasor-v2
```

## Development

```bash
# Install dependencies
cd packages/phasor-dex
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint
```

## Component Architecture

```
App Layout (providers, wallet connection)
└── Page Component
    ├── Header Section
    ├── Main Content
    │   ├── Data Fetching (hooks)
    │   ├── State Management
    │   └── UI Components (shadcn/ui)
    └── Footer/Actions
```

### Provider Hierarchy

```tsx
// app/layout.tsx
<WagmiProvider config={config}>
  <QueryClientProvider client={queryClient}>
    <ApolloProvider client={apolloClient}>
      <RainbowKitProvider>
        {children}
      </RainbowKitProvider>
    </ApolloProvider>
  </QueryClientProvider>
</WagmiProvider>
```

## Subgraph Queries

### Pool Data

```graphql
query GetPools($first: Int!, $skip: Int!) {
  pairs(first: $first, skip: $skip, orderBy: reserveUSD, orderDirection: desc) {
    id
    token0 { id symbol name decimals }
    token1 { id symbol name decimals }
    reserve0
    reserve1
    reserveUSD
    volumeUSD
    txCount
  }
}
```

### Historical Data

```graphql
# Hourly data (for 1D charts)
query GetPairHourData($pair: String!, $startTime: Int!) {
  pairHourDatas(
    where: { pairAddress: $pair, hourStartUnix_gt: $startTime }
    orderBy: hourStartUnix
  ) {
    hourStartUnix
    reserveUSD
    hourlyVolumeUSD
  }
}

# Daily data (for 1W/1M/ALL charts)
query GetPairDayData($pair: String!, $startTime: Int!) {
  pairDayDatas(
    where: { pairAddress: $pair, date_gt: $startTime }
    orderBy: date
  ) {
    date
    reserveUSD
    dailyVolumeUSD
  }
}
```

### User Positions

```graphql
query GetUserPositions($user: String!) {
  liquidityPositions(where: { user: $user, liquidityTokenBalance_gt: "0" }) {
    id
    liquidityTokenBalance
    pair {
      id
      token0 { id symbol }
      token1 { id symbol }
      totalSupply
      reserveUSD
    }
  }
}
```

## Troubleshooting

### "Missing field 'id' while extracting keyFields"

Include `id` field for all entities in GraphQL queries.

### Portfolio charts not showing

1. Check Apollo client is `apolloClient` (not `tokensApolloClient`)
2. Verify user has LP positions
3. Check address is lowercased

### Pool detail 404

Ensure pool address in URL is checksummed or handle both cases.

### Stale data after transaction

```typescript
// Refetch after mutation
const { refetch } = useQuery(GET_POOLS);

const handleSwap = async () => {
  await swap();
  await refetch();
};
```
