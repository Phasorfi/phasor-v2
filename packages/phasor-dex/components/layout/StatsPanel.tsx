"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { apolloClient } from "@/lib/apollo-client";

// Query all pools and aggregate stats client-side
const PROTOCOL_STATS_QUERY = gql`
  query ProtocolStats {
    LiquidityPoolAggregator {
      id
      totalVolumeUSD
      totalLiquidityUSD
    }
  }
`;

interface PoolData {
  id: string;
  totalVolumeUSD: string;
  totalLiquidityUSD: string;
}

interface ProtocolStatsQueryResult {
  LiquidityPoolAggregator: PoolData[];
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
  const { data } = useQuery<ProtocolStatsQueryResult>(PROTOCOL_STATS_QUERY, {
    client: apolloClient,
    pollInterval: 30000, // Refresh every 30 seconds
  });

  // Aggregate stats from all pools
  const pools = data?.LiquidityPoolAggregator || [];
  const totalVolume = pools.reduce((sum, p) => sum + parseFloat(p.totalVolumeUSD || "0"), 0).toString();
  const totalLiquidity = pools.reduce((sum, p) => sum + parseFloat(p.totalLiquidityUSD || "0"), 0).toString();
  const pairCount = pools.length;

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
