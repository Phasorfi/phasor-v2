"use client";

import { Pool } from "@/types";
import { formatTokenAmount } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, TrendingUp, BarChart3, Coins } from "lucide-react";

interface PoolDetailStatsProps {
  pool: Pool;
}

export function PoolDetailStats({ pool }: PoolDetailStatsProps) {
  const { token0, token1, reserve0, reserve1, tvlUSD, volume24hUSD, totalSupply } = pool;

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return "N/A";
    if (value === 0) return "$0";
    if (value < 0.01) return "<$0.01";
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  const stats = [
    {
      title: "Total Value Locked",
      value: formatCurrency(tvlUSD),
      icon: Droplet,
      description: tvlUSD ? "Current pool liquidity" : "Data not available",
      color: "text-blue-500",
    },
    {
      title: "24h Volume",
      value: formatCurrency(volume24hUSD),
      icon: BarChart3,
      description: volume24hUSD ? "Daily trading volume" : "Data not available",
      color: "text-purple-500",
    },
    {
      title: `${token0.symbol} Pooled`,
      value: formatTokenAmount(reserve0, token0.decimals, 2),
      icon: Coins,
      description: `Reserve of ${token0.symbol}`,
      color: "text-green-500",
    },
    {
      title: `${token1.symbol} Pooled`,
      value: formatTokenAmount(reserve1, token1.decimals, 2),
      icon: Coins,
      description: `Reserve of ${token1.symbol}`,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
