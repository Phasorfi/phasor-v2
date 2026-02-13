# Phasor DEX

A modern, high-performance decentralized exchange frontend built for the Monad blockchain. Features Uniswap V2-style AMM functionality with a sleek, cyberpunk-inspired design.

![Phasor DEX](https://via.placeholder.com/1200x630/0a0a0f/00d9ff?text=Phasor+DEX)

## Features

- **Token Swaps** - Fast, efficient token swaps with real-time price quotes
- **Liquidity Pools** - Add and remove liquidity to earn trading fees
- **Price Impact Display** - See price impact before confirming trades
- **Slippage Settings** - Customize slippage tolerance and transaction deadlines
- **Wallet Integration** - Connect with MetaMask, WalletConnect, Coinbase Wallet, and more
- **Responsive Design** - Works beautifully on desktop and mobile

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Web3**: wagmi v2, viem, RainbowKit v2
- **Styling**: Tailwind CSS, shadcn/ui components
- **State**: Zustand, TanStack Query
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- A WalletConnect Project ID ([Get one here](https://cloud.walletconnect.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/phasor-dex.git
   cd phasor-dex
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your WalletConnect Project ID:
   ```
   DEFAULT_WALLET_CONNECT_ID=your_project_id_here
   ```

4. **Configure your contracts**
   
   Edit `config/chains.ts` and update:
   - Monad chain ID and RPC URLs
   - Your deployed Router and Factory contract addresses
   - Token addresses (WMON, USDC, etc.)

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## Project Structure

```
phasor-dex/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home/Swap page
│   ├── swap/              # Swap page
│   └── pools/             # Pools pages
│       ├── page.tsx       # Pool listing
│       ├── add/           # Add liquidity
│       └── remove/        # Remove liquidity
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── common/            # Shared components (TokenSelector, Settings)
│   ├── swap/              # Swap-specific components
│   ├── pool/              # Pool-specific components
│   └── layout/            # Header, Footer
├── config/
│   ├── chains.ts          # Chain config, contract addresses
│   ├── abis.ts            # Contract ABIs
│   └── index.ts           # Wagmi/RainbowKit config
├── hooks/                  # Custom React hooks
│   ├── useTokenBalance.ts # Token balance hook
│   ├── usePair.ts         # Pair/reserves hook
│   ├── useSwap.ts         # Swap hook
│   └── useAddLiquidity.ts # Add liquidity hook
├── lib/
│   ├── utils.ts           # Utility functions
│   └── store.ts           # Zustand stores
├── types/                  # TypeScript types
└── styles/
    └── globals.css        # Global styles & Tailwind
```

## Configuration

### Contract Addresses

Update `config/chains.ts` with your deployed contract addresses:

```typescript
export const CONTRACTS = {
  FACTORY: "0x...", // Your Factory address
  ROUTER: "0x...",  // Your Router address
  WMON: "0x...",    // Wrapped Monad address
  USDC: "0x...",    // USDC address
  USDT: "0x...",    // USDT address
} as const;
```

### Chain Configuration

Update the Monad chain configuration in `config/chains.ts`:

```typescript
export const monad = defineChain({
  id: YOUR_CHAIN_ID,
  name: "Monad",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["https://your-rpc-url"],
    },
  },
  // ...
});
```

### Adding Tokens

Add default tokens in `config/chains.ts`:

```typescript
export const DEFAULT_TOKENS: Token[] = [
  {
    address: "0x...",
    symbol: "TOKEN",
    name: "Token Name",
    decimals: 18,
    logoURI: "/tokens/token.svg",
  },
  // ...
];
```

## Customization

### Branding

The color scheme is defined in `tailwind.config.ts`. The main brand colors are:

- **Primary (Phasor Cyan)**: `#00d9ff`
- **Accent Pink**: `#ff0080`
- **Accent Purple**: `#7928ca`

To change the brand colors, update the `phasor` color palette in the Tailwind config.

### Styling

- Global styles: `styles/globals.css`
- Component styles: Tailwind classes + shadcn/ui
- Animations: Tailwind animate + Framer Motion

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **New Hook**: Add to `hooks/` directory
2. **New Component**: Add to appropriate `components/` subdirectory
3. **New Page**: Add to `app/` directory following Next.js conventions
4. **New ABI**: Add to `config/abis.ts`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Build

```bash
npm run build
npm run start
```

## Security

- All contract interactions use wagmi's type-safe hooks
- Slippage protection on all swaps
- Transaction deadline protection
- No private keys are ever stored

## Documentation

For detailed technical documentation, see:

- [Architecture Overview](../../docs/ARCHITECTURE.md)
- [Frontend Documentation](../../docs/FRONTEND.md)
- [Smart Contracts](../../docs/SMART_CONTRACTS.md)
- [Infrastructure](../../docs/INFRASTRUCTURE.md)

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

---

Built with ⚡ for the Monad ecosystem
