"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo-client";

const FACTORY_STATS_QUERY = gql`
  query FactoryStats {
    uniswapFactories(first: 1) {
      id
      pairCount
      totalVolumeUSD
      totalLiquidityUSD
    }
  }
`;

interface FactoryData {
  id: string;
  pairCount: number;
  totalVolumeUSD: string;
  totalLiquidityUSD: string;
}

interface FactoryStatsQueryResult {
  uniswapFactories: FactoryData[];
}

function formatNumber(value: string | number, decimals: number = 2): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";

  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(decimals)}B`;
  } else if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(decimals)}M`;
  } else if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(decimals)}K`;
  }
  return `$${num.toFixed(decimals)}`;
}

export function StatsPanel() {
  const { data } = useQuery<FactoryStatsQueryResult>(FACTORY_STATS_QUERY, {
    client: apolloClient,
    pollInterval: 30000, // Refresh every 30 seconds
  });

  const factory = data?.uniswapFactories?.[0];
  const totalVolume = factory?.totalVolumeUSD || "0";
  const totalLiquidity = factory?.totalLiquidityUSD || "0";
  const pairCount = factory?.pairCount || 0;

  return (
    <aside className="hidden lg:flex fixed right-0 bottom-0 w-[200px] flex-col justify-end p-6 pb-20 pr-6 z-40">
      <div className="space-y-5">
        <div className="text-right">
          <p className="text-xl font-mono font-medium text-white leading-none">
            {formatNumber(totalVolume, 0)}
          </p>
          <p className="text-xs text-[#614bdf] tracking-wider leading-tight">Total Volume</p>
        </div>

        <div className="text-right">
          <p className="text-xl font-mono font-medium text-white leading-none">
            {formatNumber(totalLiquidity, 0)}
          </p>
          <p className="text-xs text-[#614bdf] tracking-wider leading-tight">Total Liquidity</p>
        </div>

        <div className="text-right">
          <p className="text-xl font-mono font-medium text-white leading-none">
            {pairCount}
          </p>
          <p className="text-xs text-[#614bdf] tracking-wider leading-tight">Trading Pairs</p>
        </div>
      </div>
    </aside>
  );
}
