"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

interface EmptyPortfolioStateProps {
  type: "not-connected" | "no-holdings";
}

export function EmptyPortfolioState({ type }: EmptyPortfolioStateProps) {
  if (type === "not-connected") {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-4">
        <div className="rounded-full bg-muted p-6 mb-6">
          <Wallet className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Connect your wallet to view your portfolio, track your assets, and see your transaction history.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4">
      <div className="rounded-full bg-muted p-6 mb-6">
        <Wallet className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">No Assets Found</h3>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Your portfolio is empty. Start by swapping tokens or adding liquidity to a pool.
      </p>
      <div className="flex gap-3">
        <Link href="/swap">
          <Button>Swap Tokens</Button>
        </Link>
        <Link href="/pools">
          <Button variant="outline">Add Liquidity</Button>
        </Link>
      </div>
    </div>
  );
}
