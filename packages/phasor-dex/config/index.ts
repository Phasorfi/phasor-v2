import "@/lib/polyfills";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "viem";
import { monad } from "./chains";

// ============================================
// WAGMI + RAINBOWKIT CONFIGURATION
// ============================================

export const config = getDefaultConfig({
  appName: "Phasor",
  projectId: process.env.NEXT_PUBLIC_DEFAULT_WALLET_CONNECT_ID || "YOUR_PROJECT_ID", // TODO: Get from WalletConnect Cloud
  chains: [monad],
  ssr: false, // Disable SSR to avoid indexedDB errors during build
  transports: {
    [monad.id]: http(process.env.NEXT_PUBLIC_DEFAULT_RPC_URL || "https://testnet.monad.xyz", {
      // Retry configuration for failed requests
      retryCount: 3,
      retryDelay: 150,
      // Timeout for RPC requests (30 seconds)
      timeout: 30_000,
    }),
  },
});

// Re-export everything from chains
export * from "./chains";
export * from "./abis";
