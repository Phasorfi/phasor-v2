"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp } from "lucide-react";
import { Pool } from "@/types";
import { formatTokenAmount } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PoolCardProps {
  pool: Pool;
}

export function PoolCard({ pool }: PoolCardProps) {
  const { token0, token1, reserve0, reserve1, tvlUSD, volume24hUSD, apr } = pool;

  // Format currency values
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return null;
    if (value === 0) return "$0";
    if (value < 0.01) return "<$0.01";
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (value >= 1_000) {
      return `$${(value / 1_000).toFixed(2)}K`;
    }
    return `$${value.toFixed(2)}`;
  };

  // Format APR percentage
  const formatAPR = (value: number | undefined) => {
    if (value === undefined) return null;
    if (value === 0) return "0%";
    return `${value.toFixed(2)}%`;
  };

  // Determine if pool is new/inactive (no reserves)
  const isNewPool = reserve0 === BigInt(0) || reserve1 === BigInt(0);
  const hasLiquidity = reserve0 > BigInt(0) && reserve1 > BigInt(0);

  // Calculate a simple liquidity indicator based on reserves
  // This gives users an idea of pool depth without USD pricing
  const getLiquidityIndicator = () => {
    if (!hasLiquidity) return null;

    // Format reserves in a readable way
    const reserve0Formatted = formatTokenAmount(reserve0, token0.decimals, 2);
    const reserve1Formatted = formatTokenAmount(reserve1, token1.decimals, 2);

    return `${reserve0Formatted} ${token0.symbol} / ${reserve1Formatted} ${token1.symbol}`;
  };

  return (
    <Link href={`/pools/${pool.address}`} className="block">
      <Card className="pool-card hover:border-primary/30 transition-all duration-300 w-full max-w-md mx-auto cursor-pointer">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            {/* Token Pair */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center overflow-hidden z-10">
                {token0.logoURI ? (
                  <Image
                    src={token0.logoURI}
                    alt={token0.symbol}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {token0.symbol.charAt(0)}
                  </span>
                )}
              </div>
              <div className="w-10 h-10 rounded-full bg-secondary border-2 border-card flex items-center justify-center overflow-hidden">
                {token1.logoURI ? (
                  <Image
                    src={token1.logoURI}
                    alt={token1.symbol}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-bold">
                    {token1.symbol.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold">
                {token0.symbol}/{token1.symbol}
              </h3>
              <p className="text-sm text-muted-foreground">0.3% fee</p>
            </div>
          </div>

          {/* APR Badge */}
          {formatAPR(apr) ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 text-green-500 text-sm">
              <TrendingUp className="h-3 w-3" />
              <span>{formatAPR(apr)} APR</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded border border-border bg-muted text-muted-foreground text-xs">
              <span>{isNewPool ? "New pool" : "No data yet"}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-sm text-muted-foreground">Liquidity</p>
            {formatCurrency(tvlUSD) ? (
              <p className="font-medium">{formatCurrency(tvlUSD)}</p>
            ) : hasLiquidity ? (
              <p className="text-sm font-medium text-green-500">Active</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Add liquidity first
              </p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">24h Volume</p>
            {formatCurrency(volume24hUSD) ? (
              <p className="font-medium">{formatCurrency(volume24hUSD)}</p>
            ) : hasLiquidity ? (
              <p className="text-sm text-muted-foreground">Trading enabled</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No trades yet
              </p>
            )}
          </div>
        </div>

        {/* Reserves */}
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{token0.symbol}</span>
            <span>{formatTokenAmount(reserve0, token0.decimals, 4)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{token1.symbol}</span>
            <span>{formatTokenAmount(reserve1, token1.decimals, 4)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = "/pools/add";
            }}
          >
            Add Liquidity
          </Button>
          <Button
            className="flex-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = "/swap";
            }}
          >
            Swap
          </Button>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

// Placeholder pool card for when no pools exist
export function EmptyPoolState() {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
        <svg
          className="w-10 h-10 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-2">No pools yet</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        Be the first to create a liquidity pool and start earning trading fees.
      </p>
      <Link href="/pools/add">
        <Button size="lg">Create Pool</Button>
      </Link>
    </div>
  );
}
