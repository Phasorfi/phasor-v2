# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `yarn dev` - Start development server on http://localhost:3000
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn lint` - Run ESLint

## Project Architecture

Phasor DEX is a modern Uniswap V2-style DEX frontend built for the Monad blockchain using Next.js 14 with App Router, TypeScript, wagmi v2, and RainbowKit v2.

### Key Architecture Patterns

**State Management:**
- Zustand stores in `/lib/store.ts` for persistent settings, custom tokens, and transaction history
- TanStack Query for server state via wagmi hooks
- Local component state for UI interactions

**Web3 Integration:**
- wagmi v2 + viem for blockchain interactions
- RainbowKit v2 for wallet connections
- Configuration in `/config/` - chains, contract addresses, ABIs
- Custom hooks in `/hooks/` abstract complex Web3 logic (useSwap, usePair, useAddLiquidity)

**Contract Structure:**
- Implements Uniswap V2 AMM model
- Core contracts: Factory, Router, Pair (defined in `/config/chains.ts`)
- Supports native MON and ERC20 tokens
- All addresses and chain config marked with TODO comments for deployment

**Component Architecture:**
- `/components/ui/` - shadcn/ui base components
- `/components/common/` - Shared components (TokenSelector, SettingsPopover)
- `/components/swap/`, `/components/pool/` - Feature-specific components
- `/app/` - Next.js App Router pages

**Styling:**
- Tailwind CSS with custom cyberpunk theme (phasor cyan: #00d9ff)
- Custom color palette in `tailwind.config.ts`
- Global styles in `styles/globals.css`

### Configuration Requirements

Before development, update these TODO items in `/config/chains.ts`:
- Monad chain ID and RPC URLs
- Deployed Factory and Router contract addresses  
- Token addresses (WMON, USDC, etc.)
- Set up `.env.local` with NEXT_PUBLIC_WALLET_CONNECT_ID

### Type Definitions

All Web3 types are defined in `/types/index.ts` including Token, Pool, SwapQuote, and UserPosition interfaces that are used throughout the application.