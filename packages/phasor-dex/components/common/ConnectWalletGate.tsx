"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Wallet } from "lucide-react";

interface ConnectWalletGateProps {
  children: React.ReactNode;
}

export function ConnectWalletGate({ children }: ConnectWalletGateProps) {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  // If connected, render children
  if (isConnected) {
    return <>{children}</>;
  }

  // Show connect wallet screen
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="flex flex-col items-center max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/images/logo.png"
            alt="Phasor"
            width={180}
            height={60}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* Icon */}
        <div className="rounded-full bg-white/5 border border-white/10 p-6 mb-6">
          <Wallet className="h-12 w-12 text-white/60" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl font-semibold text-white mb-3">
          Connect Your Wallet
        </h1>

        {/* Description */}
        <p className="text-white/50 text-sm mb-8 leading-relaxed">
          Connect your wallet to access Phasor DEX. Swap tokens, provide liquidity,
          vote on gauges, and manage your portfolio.
        </p>

        {/* Connect Button */}
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <button
              onClick={openConnectModal}
              className="px-8 py-3 text-sm font-medium rounded-lg bg-[#614bdf] hover:bg-[#614bdf]/90 transition-colors text-white"
            >
              Connect Wallet
            </button>
          )}
        </ConnectButton.Custom>

        {/* Supported wallets hint */}
        <p className="text-white/30 text-xs mt-6">
          Supports MetaMask, WalletConnect, Coinbase Wallet, and more
        </p>
      </div>
    </div>
  );
}
