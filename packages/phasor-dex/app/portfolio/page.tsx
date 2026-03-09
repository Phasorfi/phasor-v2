"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioOverview } from "@/components/portfolio/PortfolioOverview";
import { TokensTable } from "@/components/portfolio/TokensTable";
import { ActivityTable } from "@/components/portfolio/ActivityTable";
import { EmptyPortfolioState } from "@/components/portfolio/EmptyPortfolioState";
import { usePortfolioTokens } from "@/hooks/usePortfolioTokens";
import { useUserTransactions } from "@/hooks/useUserTransactions";
import { DEFAULT_TOKENS } from "@/config";

export default function PortfolioPage() {
  const { address: userAddress } = useAccount();
  const [mounted, setMounted] = useState(false);

  // Get portfolio tokens for Tokens tab
  const { tokens, isLoading: tokensLoading } = usePortfolioTokens(DEFAULT_TOKENS);

  // Get user transactions for Activity tab
  const {
    transactions,
    isLoading: transactionsLoading,
    hasMore,
    loadMore,
  } = useUserTransactions();

  // Prevent hydration mismatch by waiting for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during hydration
  if (!mounted) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Portfolio</h1>
        </div>
      </div>
    );
  }

  // Show empty state if not connected
  if (!userAddress) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <EmptyPortfolioState type="not-connected" />
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">Portfolio</h1>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0">
            <PortfolioOverview />
          </TabsContent>

          {/* Tokens Tab */}
          <TabsContent value="tokens" className="mt-0">
            <TokensTable tokens={tokens} isLoading={tokensLoading} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-0">
            <ActivityTable
              transactions={transactions}
              isLoading={transactionsLoading}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
