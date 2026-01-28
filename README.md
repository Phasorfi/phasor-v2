# Phasor V2 DEX

> A high-performance Uniswap V2-style decentralized exchange built for the Monad blockchain

Phasor V2 is a complete DEX protocol featuring smart contracts, a modern frontend interface, and subgraph indexing. Built with gas optimization and user experience as top priorities.

## 🏗️ Architecture

The Phasor V2 protocol consists of four main components:

```
phasor-v2/
├── packages/core/          # Core AMM smart contracts (UniswapV2Factory, UniswapV2Pair)
├── packages/periphery/     # Router contracts for swaps and liquidity management
├── packages/phasor-dex/    # Next.js frontend application
└── packages/v2-subgraph/   # The Graph subgraph for indexing protocol data
```

### Core Contracts

The core implements the automated market maker (AMM) logic:

- **UniswapV2Factory** - Creates and tracks trading pairs
- **UniswapV2Pair** - Individual liquidity pools with constant product formula (x * y = k)
- **UniswapV2ERC20** - LP token implementation

[View Core Contracts →](packages/core/contracts/)

### Periphery Contracts

The periphery provides user-facing interfaces:

- **UniswapV2Router02** - Safe routing for swaps and liquidity operations
- **UniswapV2Library** - Helper functions for price calculations and pair addresses

[View Periphery Contracts →](packages/periphery/contracts/)

### Frontend (phasor-dex)

A modern Next.js 14 application with:

- Token swaps with real-time price quotes
- Liquidity pool management (add/remove)
- Pool analytics and individual pool pages
- Gas estimation display
- Multi-wallet support (MetaMask, WalletConnect, Coinbase)

**Tech Stack:** Next.js 14, TypeScript, wagmi v2, viem, RainbowKit v2, Tailwind CSS

[View Frontend Documentation →](packages/phasor-dex/README.md)

### Subgraph

The Graph protocol integration for indexing on-chain data:

- Real-time pair data (reserves, volume, TVL)
- Historical price and liquidity charts
- Transaction history (swaps, mints, burns)
- User position tracking

[View Subgraph Documentation →](packages/v2-subgraph/)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **Foundry** (for smart contracts) - [Install Guide](https://book.getfoundry.sh/getting-started/installation)
- **Docker** (optional, for local subgraph)
- **Yarn** or npm

### 1. Clone Repository

```bash
git clone https://github.com/your-org/phasor-v2.git
cd phasor-v2
```

### 2. Install Dependencies

```bash
# Install root dependencies
yarn install

# Install contract dependencies
forge install
```

### 3. Deploy Contracts

The automated deployment script handles everything:

```bash
./deploy.sh
```

This will:
- Calculate the correct INIT_CODE_HASH
- Deploy Factory, Router, and test tokens
- Update frontend configuration automatically

For custom deployments or troubleshooting, see [DEPLOYMENT.md](DEPLOYMENT.md)

### 4. Run Frontend

```bash
cd packages/phasor-dex

# Set up environment
cp .env.example .env.local

# Add your WalletConnect Project ID to .env.local
# DEFAULT_WALLET_CONNECT_ID=your_project_id

# Start dev server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 5. Deploy Subgraph (Optional)

```bash
cd packages/v2-subgraph

# Update v2-subgraph.yaml with your contract addresses
# Then deploy to The Graph
yarn deploy
```

## 📚 Documentation

### Getting Started
- [Deployment Guide](DEPLOYMENT.md) - Deploy contracts and configure frontend
- [Frontend Setup](packages/phasor-dex/README.md) - Run the DEX interface
- [Testing Guide](packages/phasor-dex/TESTING.md) - Run integration tests

### Development
- [Best Practices](packages/phasor-dex/BEST_PRACTICES.md) - Code patterns and Uniswap alignment
- [Monad Integration](packages/phasor-dex/MONAD_INTEGRATION.md) - Hybrid data fetching approach
- [Token Management](packages/phasor-dex/TOKEN_LIST.md) - Adding and managing tokens
- [Pool Architecture](packages/phasor-dex/POOLS.md) - Pool listing and management

### Protocol
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf) - Protocol specification
- [Core Contracts](packages/core/) - AMM implementation
- [Periphery Contracts](packages/periphery/) - Router and helpers

## 🔧 How It Works

### Automated Market Maker (AMM)

Phasor V2 uses the Uniswap V2 constant product formula:

```
x * y = k
```

Where:
- `x` = Reserve of token A
- `y` = Reserve of token B
- `k` = Constant product

**Example:** A pool with 100 TOKEN_A and 50 TOKEN_B maintains a constant product of 5,000.

### Fee Structure

- **0.3% trading fee** on all swaps
- 100% of fees go to liquidity providers
- Fees are automatically reinvested into the pool

### Liquidity Provision

Users can:
1. **Add Liquidity** - Deposit token pairs, receive LP tokens
2. **Remove Liquidity** - Burn LP tokens, withdraw proportional reserves + fees
3. **Earn Fees** - Receive share of 0.3% trading fees based on pool ownership

## 🛠️ Development Setup

### Smart Contracts

```bash
# Compile contracts
forge build packages/ --force

# Run tests
forge test

# Calculate INIT_CODE_HASH (required after contract changes)
npx ts-node script/calculateInitHash.ts
```

### Frontend

```bash
cd packages/phasor-dex

# Development
yarn dev

# Type checking
yarn tsc --noEmit

# Build for production
yarn build
```

### Subgraph

```bash
cd packages/v2-subgraph

# Generate types
yarn codegen

# Build
yarn build

# Deploy to local node
yarn create-local
yarn deploy-local
```

## 🌐 Network Support

### Monad Testnet
- Chain ID: `41454`
- RPC: `https://testnet-rpc.monad.xyz/`
- Block Explorer: `https://explorer.testnet.monad.xyz/`

### Monad Mainnet (Coming Soon)
- Chain ID: TBD
- High throughput, low latency blockchain
- EVM compatible

## 📊 Key Features

### Frontend Gas Optimizations

Following Uniswap best practices:

- ✅ **Dynamic gas limits** - No hard-coded values, wagmi auto-estimates
- ✅ **Gas cost display** - Show users estimated costs before transactions
- ✅ **Static gas estimates** - 127K for swaps, 200K for liquidity adds
- ✅ **Exact approvals** - User controls approval amounts in wallet

[View Gas Optimization Details →](packages/phasor-dex/BEST_PRACTICES.md)

### Hybrid Data Fetching

Combines direct contract calls with subgraph enrichment:

- **Contract calls** (primary) - Always works, provides real-time reserves
- **Subgraph data** (enrichment) - Adds TVL, volume, APR when available

This ensures the DEX works even when subgraph is unavailable.

[View Monad Integration Details →](packages/phasor-dex/MONAD_INTEGRATION.md)

### Pool Analytics

- Individual pool pages (Uniswap-style)
- Liquidity and volume tracking
- APR calculations based on 24h volume
- Historical charts (when subgraph available)
- Transaction history

## 🔐 Security

- **Audited Code** - Based on battle-tested Uniswap V2
- **Slippage Protection** - Customizable slippage tolerance
- **Deadline Protection** - Transaction expiration times
- **Type Safety** - Full TypeScript coverage
- **No Private Keys** - All signing happens in user's wallet

## 🤝 Contributing

We welcome contributions! Please ensure:

1. Code follows existing patterns
2. Tests pass (`forge test` for contracts, `yarn test` for frontend)
3. TypeScript types are correct
4. Documentation is updated

## 📄 License

MIT License - see [LICENSE](LICENSE) for details

## 🔗 Resources

### External Documentation
- [Uniswap V2 Docs](https://docs.uniswap.org/contracts/v2/overview)
- [Uniswap V2 Whitepaper](https://uniswap.org/whitepaper.pdf)
- [wagmi Documentation](https://wagmi.sh/)
- [viem Documentation](https://viem.sh/)
- [The Graph Documentation](https://thegraph.com/docs/)
- [Foundry Book](https://book.getfoundry.sh/)

### Community
- [Monad Website](https://monad.xyz/)
- [Monad Discord](https://discord.gg/monad)
- [Monad Twitter](https://twitter.com/monad_xyz)

## 📞 Support

For issues and questions:
- Open a [GitHub Issue](https://github.com/your-org/phasor-v2/issues)
- Check existing [Documentation](packages/phasor-dex/README.md)
- Review [Deployment Guide](DEPLOYMENT.md)

---

Built with ⚡ for the Monad ecosystem
