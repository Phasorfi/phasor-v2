"use client";

import { useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { usePortfolioTokens } from "@/hooks/usePortfolioTokens";
import { usePortfolioValue } from "@/hooks/usePortfolioValue";
import { usePortfolioHistory, HistoryPeriod } from "@/hooks/usePortfolioHistory";
import { PortfolioStats } from "./PortfolioStats";
import { PortfolioChart } from "./PortfolioChart";
import { EmptyPortfolioState } from "./EmptyPortfolioState";

// Import token list
import { DEFAULT_TOKENS } from "@/config";

export function PortfolioOverview() {
  const { address: userAddress } = useAccount();
  const [period, setPeriod] = useState<HistoryPeriod>("1M");

  // Get portfolio token data
  const { tokens, totalValue: tokenValue, isLoading: tokensLoading } = usePortfolioTokens(DEFAULT_TOKENS);

  // Get portfolio value (includes LP positions)
  const portfolioValue = usePortfolioValue(tokenValue);

  // Get historical data
  const { data: historyData, isLoading: historyLoading } = usePortfolioHistory(DEFAULT_TOKENS, period);

  // Check if user has any holdings
  const hasHoldings = useMemo(() => {
    return tokens.length > 0 || portfolioValue.lpValue > 0;
  }, [tokens.length, portfolioValue.lpValue]);

  // Show empty state if not connected
  if (!userAddress) {
    return <EmptyPortfolioState type="not-connected" />;
  }

  // Show empty state if no holdings
  if (!tokensLoading && !portfolioValue.isLoading && !hasHoldings) {
    return <EmptyPortfolioState type="no-holdings" />;
  }

  // Show loading state
  if (tokensLoading || portfolioValue.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-muted-foreground">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <PortfolioStats
        totalValue={portfolioValue.totalValue}
        change24h={portfolioValue.change24h}
        change24hPercent={portfolioValue.change24hPercent}
        tokenValue={portfolioValue.tokenValue}
        lpValue={portfolioValue.lpValue}
      />

      {/* Chart */}
      <PortfolioChart
        data={historyData}
        period={period}
        onPeriodChange={setPeriod}
        isLoading={historyLoading}
      />
    </div>
  );
}
