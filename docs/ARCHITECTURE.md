# Phasor DEX - Architecture Overview

A decentralized exchange built on Monad testnet, featuring Uniswap V2-style AMM with yield farming and token launchpad capabilities.

## Quick Start

```bash
# 1. Start local blockchain
anvil --host 0.0.0.0 --chain-id 10143

# 2. Deploy all contracts and setup test data
./deploy-local-full.sh

# 3. Start Graph Node (in packages/v2-subgraph)
docker-compose up -d

# 4. Start frontend
cd packages/phasor-dex && npm run dev
```

## Monorepo Structure

```
phasor-v2/
├── packages/
│   ├── core/                    # Uniswap V2 fork (AMM contracts)
│   ├── periphery/               # Uniswap V2 Router & helpers
│   ├── phasor-contracts/        # Custom PHASOR ecosystem
│   ├── v2-subgraph/             # The Graph indexer
│   └── phasor-dex/              # Next.js frontend
├── docs/                        # Documentation
├── deploy-local-full.sh         # Local deployment script
├── cannonfile.local-full.toml   # Cannon deployment config
└── foundry.toml                 # Foundry configuration
```

## Package Descriptions

### `packages/core` - Uniswap V2 Fork

Pure Uniswap V2 core contracts. **Do not modify** - this is a direct fork.

| Contract | Description |
|----------|-------------|
| `UniswapV2Factory` | Creates and tracks trading pairs |
| `UniswapV2Pair` | AMM pool with constant product formula (x*y=k) |
| `UniswapV2ERC20` | LP token implementation |

### `packages/periphery` - Router & Helpers

Uniswap V2 periphery contracts. **Do not modify** - this is a direct fork.

| Contract | Description |
|----------|-------------|
| `UniswapV2Router02` | User-facing swap and liquidity functions |
| `UniswapV2Library` | Price and reserve calculations |

### `packages/phasor-contracts` - Custom Ecosystem

All custom Phasor contracts live here.

| Directory | Contracts | Description |
|-----------|-----------|-------------|
| `token/` | `PhasorToken` | Governance token (1B max supply) |
| `farming/` | `MasterChef` | Yield farming (100 PHASOR/block) |
| `launchpad/` | `FairLaunch`, `LaunchpadFactory`, `TokenVesting` | Token sale platform |

### `packages/v2-subgraph` - The Graph Indexer

Indexes on-chain events for fast querying. Single subgraph: `phasor-v2`.

**Entities**: Pair, Token, Swap, Mint, Burn, PairDayData, PairHourData, TokenDayData

### `packages/phasor-dex` - Frontend

Next.js 14 application with App Router.

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/swap` | Token swap interface |
| `/pools` | Pool listing |
| `/pools/[address]` | Pool detail with charts |
| `/pools/add` | Add liquidity |
| `/pools/remove` | Remove liquidity |
| `/portfolio` | User portfolio & positions |

## Technology Stack

| Layer | Technology |
|-------|------------|
| Blockchain | Monad (EVM-compatible) |
| Smart Contracts | Solidity 0.8.20, Foundry |
| Deployment | Cannon |
| Indexing | The Graph Protocol |
| Frontend | Next.js 14, React 18, TypeScript |
| Web3 | wagmi v2, viem, RainbowKit |
| State | Zustand, Apollo Client |
| Styling | Tailwind CSS, shadcn/ui |

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Action                               │
│                    (Swap, Add Liquidity)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ wagmi hooks  │  │ Custom hooks │  │ Apollo Client        │   │
│  │ (write ops)  │  │ (useSwap)    │  │ (read from subgraph) │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│    Smart Contracts      │     │         Graph Node              │
│  ┌───────────────────┐  │     │  ┌───────────────────────────┐  │
│  │ Router            │  │     │  │ Indexes events:           │  │
│  │ Factory           │──┼────▶│  │ - Swap, Mint, Burn        │  │
│  │ Pair              │  │     │  │ - PairCreated             │  │
│  │ MasterChef        │  │     │  │ - Deposit, Withdraw       │  │
│  │ LaunchpadFactory  │  │     │  └───────────────────────────┘  │
│  └───────────────────┘  │     └─────────────────────────────────┘
└─────────────────────────┘
```

## Key Configuration Files

| File | Purpose |
|------|---------|
| `foundry.toml` | Foundry compiler settings, remappings |
| `cannonfile.local-full.toml` | Contract deployment order and args |
| `deploy-local-full.sh` | Full local deployment automation |
| `.env.local` (frontend) | RPC URL, contract addresses |

## Environment Variables

Frontend (`packages/phasor-dex/.env.local`):

```bash
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_DEFAULT_RPC_URL=http://127.0.0.1:8545
NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS=0x...
NEXT_PUBLIC_DEFAULT_WMON_ADDRESS=0x...
NEXT_PUBLIC_PHASOR_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_MASTERCHEF_ADDRESS=0x...
NEXT_PUBLIC_LAUNCHPAD_FACTORY_ADDRESS=0x...
NEXT_PUBLIC_SUBGRAPH_URL=http://127.0.0.1:8000/subgraphs/name/phasor-v2
```

## Related Documentation

- [Smart Contracts](./SMART_CONTRACTS.md) - Contract details and interactions
- [Frontend](./FRONTEND.md) - React hooks and components
- [Infrastructure](./INFRASTRUCTURE.md) - Deployment and testing
- [Security](./SECURITY.md) - Security considerations
