import { defineChain } from "viem";
import { Address } from "viem";

// ============================================
// MONAD TESTNET CONFIGURATION
// ============================================

export const monad = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "https://testnet-rpc.monad.xyz"],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "https://testnet-rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "Monad Testnet Explorer",
      url: "https://testnet.monadvision.com/",
    },
  },
  testnet: true,
});

// ============================================
// CONTRACT ADDRESSES
// ============================================
// TODO: Replace with your deployed contract addresses

export const CONTRACTS = {
  // Core Uniswap V2 contracts - from environment variables
  FACTORY: process.env.NEXT_PUBLIC_DEFAULT_FACTORY_ADDRESS as Address,
  ROUTER: process.env.NEXT_PUBLIC_DEFAULT_ROUTER_ADDRESS as Address,

  // Wrapped MON (WMON) address
  WMON: (process.env.NEXT_PUBLIC_DEFAULT_WMON_ADDRESS || "0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701") as Address,
} as const;

// ============================================
// DEFAULT TOKENS LIST (from token list standard)
// ============================================

import { Token } from "@/types";
import tokenList from "@/public/tokenlist.json";

// Load tokens from the token list JSON file
// Filters by current chain ID (10143 for Monad testnet)
export const DEFAULT_TOKENS: Token[] = tokenList.tokens
  .filter((token) => token.chainId === monad.id)
  .map((token) => ({
    address: token.address as Address,
    symbol: token.symbol,
    name: token.name,
    decimals: token.decimals,
    logoURI: token.logoURI,
    tags: (token as any).tags || [],
  }));

// Native token representation (for UI)
export const NATIVE_TOKEN: Token = {
      address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address, //TODO: CHANGE THIS TO ZERO ADDRESS
      name: "Monad",
      symbol: "MON",
      decimals: 18,
      logoURI: "https://raw.githubusercontent.com/monad-crypto/token-list/refs/heads/main/mainnet/MON/logo.svg"
};

// ============================================
// DEX SETTINGS
// ============================================

export const DEX_SETTINGS = {
  // Default slippage tolerance in basis points (50 = 0.5%)
  DEFAULT_SLIPPAGE: 50,
  
  // Default transaction deadline in minutes
  DEFAULT_DEADLINE: 20,
  
  // Uniswap V2 fee (0.3%)
  SWAP_FEE_BPS: 30,
  
  // Minimum liquidity locked forever (Uniswap V2)
  MINIMUM_LIQUIDITY: BigInt(1000),
} as const;
