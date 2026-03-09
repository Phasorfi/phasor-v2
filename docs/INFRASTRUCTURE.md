# Infrastructure Documentation

## Local Development Setup

### Prerequisites

- Node.js 18+
- Foundry (forge, cast, anvil)
- Docker & Docker Compose
- jq, bc (for deployment script)

### Install Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Clone and Setup

```bash
git clone <repo>
cd phasor-v2

# Install dependencies
npm install

# Install OpenZeppelin contracts
forge install openzeppelin/openzeppelin-contracts@v5.1.0
```

## Foundry Configuration

**File**: `foundry.toml`

```toml
[profile.default]
src = "packages/"
out = "out"
libs = ["node_modules", "lib", "packages/core/node_modules", "packages/periphery/node_modules"]
remappings = [
    "@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/",
    "@uniswap/v2-core/=packages/periphery/node_modules/@uniswap/v2-core/",
    "@uniswap/lib/=packages/periphery/node_modules/@uniswap/lib/"
]
optimizer = true
optimizer_runs = 99999
```

**Important**: Always run `forge build` and `forge test` from the repository root.

## Cannon Deployment

**File**: `cannonfile.local-full.toml`

Cannon handles deterministic contract deployment with dependency management.

### Deployment Order

```toml
# 1. Wrapped Monad
[deploy.WMON]
artifact = "WETH9"

# 2. Uniswap Core
[deploy.UniswapV2Factory]
artifact = "packages/core/contracts/UniswapV2Factory.sol:UniswapV2Factory"

[deploy.UniswapV2Router]
artifact = "UniswapV2Router02"
depends = ["deploy.UniswapV2Factory", "deploy.WMON"]

# 3. Mock Tokens
[deploy.USDC]
artifact = "packages/core/contracts/test/MockUSDC.sol:MockUSDC"

# 4. PHASOR Ecosystem
[deploy.PhasorToken]
artifact = "packages/phasor-contracts/contracts/token/PhasorToken.sol:PhasorToken"

[deploy.MasterChef]
artifact = "packages/phasor-contracts/contracts/farming/MasterChef.sol:MasterChef"
depends = ["deploy.PhasorToken"]

# 5. Launchpad
[deploy.FairLaunchTemplate]
artifact = "packages/phasor-contracts/contracts/launchpad/FairLaunch.sol:FairLaunch"

[deploy.LaunchpadFactory]
artifact = "packages/phasor-contracts/contracts/launchpad/LaunchpadFactory.sol:LaunchpadFactory"
depends = ["deploy.FairLaunchTemplate"]
```

## Local Deployment Script

**File**: `deploy-local-full.sh`

Automated full deployment with test data.

### Usage

```bash
# Full deployment (includes 30 days of historical data)
./deploy-local-full.sh

# Quick deployment (skip historical data)
./deploy-local-full.sh --skip-history
```

### What It Does

1. **Check Anvil** - Verifies local blockchain is running
2. **Compile Contracts** - `forge build`
3. **Calculate Init Hash** - For UniswapV2Library
4. **Deploy Contracts** - Via Cannon
5. **Create Liquidity Pools** - 6 pools with realistic liquidity
6. **Setup Farming** - Add pools to MasterChef
7. **Setup Launches** - Create test fair launches
8. **Update Frontend** - Write `.env.local` with addresses
9. **Update Token List** - Generate token list JSON
10. **Deploy Subgraph** - Create and deploy subgraph
11. **Generate History** - 30 days of simulated swaps

### Liquidity Pools Created

| Pool | WMON | Counter Token | ~USD Value |
|------|------|---------------|------------|
| WMON-USDC | 3,500 | 7,000,000 | $14M |
| WMON-USDT | 2,300 | 4,600,000 | $9.2M |
| WMON-WETH | 1,500 | 600 | $3M |
| WMON-WBTC | 1,200 | 24 | $2.4M |
| WMON-SOL | 300 | 6,000 | $600k |
| WMON-FOLKS | 200 | 400,000 | $400k |

### Test Accounts

The script uses Anvil's default accounts:

| Role | Address | Private Key |
|------|---------|-------------|
| Deployer | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974...` |
| Trader 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | Account 1 |
| Trader 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | Account 2 |

## The Graph (Subgraph)

### Local Setup

```bash
cd packages/v2-subgraph

# Start Graph Node
docker-compose up -d

# Wait for Graph Node to be ready
sleep 30

# Create subgraph
npm run create-local

# Deploy subgraph
npm run deploy-local
```

### Docker Services

```yaml
# docker-compose.yml
services:
  graph-node:
    image: graphprotocol/graph-node
    ports:
      - '8000:8000'   # GraphQL HTTP
      - '8001:8001'   # GraphQL WS
      - '8020:8020'   # JSON-RPC
      - '8030:8030'   # Index status
      - '8040:8040'   # Metrics
    environment:
      ethereum: 'monad:http://host.docker.internal:8545'

  ipfs:
    image: ipfs/kubo
    ports:
      - '5001:5001'

  postgres:
    image: postgres:14
    ports:
      - '5432:5432'
```

### Subgraph Schema

Key entities in `schema.graphql`:

```graphql
type Pair @entity {
  id: ID!                    # Pair address
  token0: Token!
  token1: Token!
  reserve0: BigDecimal!
  reserve1: BigDecimal!
  reserveUSD: BigDecimal!
  volumeUSD: BigDecimal!
  txCount: BigInt!
}

type Token @entity {
  id: ID!                    # Token address
  symbol: String!
  name: String!
  decimals: BigInt!
  derivedETH: BigDecimal!
}

type Swap @entity {
  id: ID!
  pair: Pair!
  sender: Bytes!
  amount0In: BigDecimal!
  amount1In: BigDecimal!
  amount0Out: BigDecimal!
  amount1Out: BigDecimal!
  amountUSD: BigDecimal!
  timestamp: BigInt!
}

type PairDayData @entity {
  id: ID!
  pairAddress: Bytes!
  date: Int!
  reserveUSD: BigDecimal!
  dailyVolumeUSD: BigDecimal!
}

type PairHourData @entity {
  id: ID!
  pairAddress: Bytes!
  hourStartUnix: Int!
  reserveUSD: BigDecimal!
  hourlyVolumeUSD: BigDecimal!
}
```

### Query Endpoint

- Local: `http://localhost:8000/subgraphs/name/phasor-v2`
- GraphQL Playground: `http://localhost:8000/subgraphs/name/phasor-v2/graphql`

## Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run specific test file
forge test --match-path "packages/phasor-contracts/test/MasterChef.t.sol"

# Verbose output
forge test -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

### Test Structure

```
packages/phasor-contracts/test/
├── PhasorToken.t.sol    # 4 tests
├── MasterChef.t.sol     # 6 tests
└── FairLaunch.t.sol     # 7 tests
```

## Deployment Checklist

### Local Development

- [ ] Anvil running on port 8545
- [ ] Docker running for Graph Node
- [ ] `./deploy-local-full.sh` completed
- [ ] Subgraph synced (check `http://localhost:8030`)
- [ ] Frontend `.env.local` has correct addresses

### Production (Monad Testnet)

- [ ] Update RPC URL in configs
- [ ] Deploy contracts via Cannon
- [ ] Verify contracts on explorer
- [ ] Deploy subgraph to hosted service
- [ ] Update frontend environment variables

## Useful Commands

### Anvil (Local Blockchain)

```bash
# Start with custom chain ID
anvil --host 0.0.0.0 --chain-id 10143

# Start with historical timestamp (for time-travel testing)
anvil --host 0.0.0.0 --chain-id 10143 --timestamp 1704067200

# Start with more accounts
anvil --host 0.0.0.0 --accounts 20 --balance 100000
```

### Cast (Contract Interaction)

```bash
# Call view function
cast call <contract> "balanceOf(address)(uint256)" <address> --rpc-url http://localhost:8545

# Send transaction
cast send <contract> "transfer(address,uint256)" <to> <amount> --private-key <key> --rpc-url http://localhost:8545

# Get block info
cast block latest --rpc-url http://localhost:8545

# Decode calldata
cast 4byte-decode <calldata>
```

### Forge (Development)

```bash
# Build contracts
forge build

# Clean and rebuild
forge clean && forge build

# Format Solidity
forge fmt

# Generate documentation
forge doc
```

## Troubleshooting

### Anvil won't start

```bash
# Check if port is in use
lsof -i :8545
# Kill existing process
kill -9 <PID>
```

### Graph Node errors

```bash
# Check logs
docker-compose logs graph-node

# Restart services
docker-compose down && docker-compose up -d
```

### Subgraph not syncing

1. Check Graph Node is connected to Anvil
2. Verify `ethereum` env var in docker-compose
3. Check subgraph.yaml has correct network and addresses

### Forge tests fail

1. Run `forge build` first
2. Check foundry.toml remappings
3. Ensure OpenZeppelin is installed: `forge install openzeppelin/openzeppelin-contracts@v5.1.0`
