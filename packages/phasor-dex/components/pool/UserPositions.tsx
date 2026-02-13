"use client";

import React from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { Wallet } from "lucide-react";
import { UserPosition } from "@/types";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PositionRowProps {
  position: UserPosition;
}

function PositionRow({ position }: PositionRowProps) {
  const { pool, share, token0Amount, token1Amount, liquidity } = position;

  // Calculate pool value and APR
  const poolFee = pool.fee / 10000; // Convert basis points to percentage (30 -> 0.003)
  const volume24h = pool.volume24hUSD || 0;
  const tvl = pool.tvlUSD || 0;

  // Estimated APR based on 24h volume (annualized)
  const estimatedAPR = tvl > 0 ? ((volume24h * poolFee * 365) / tvl) * 100 : 0;

  return (
    <div className="p-4 rounded-xl bg-muted hover:bg-secondary transition-colors border border-border">
      <div className="flex items-center justify-between mb-3">
        {/* Pair */}
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center z-10">
              <span className="text-xs font-bold">
                {pool.token0.symbol.charAt(0)}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary border-2 border-card flex items-center justify-center">
              <span className="text-xs font-bold">
                {pool.token1.symbol.charAt(0)}
              </span>
            </div>
          </div>
          <div>
            <p className="font-medium">
              {pool.token0.symbol}/{pool.token1.symbol}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                {share.toFixed(4)}% share
              </p>
              {estimatedAPR > 0 && (
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                  {estimatedAPR.toFixed(2)}% APR
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Position Details */}
      <div className="space-y-2 mb-3 p-3 rounded-lg bg-background/50">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pooled {pool.token0.symbol}</span>
          <span className="font-medium">
            {formatTokenAmount(token0Amount, pool.token0.decimals, 6)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pooled {pool.token1.symbol}</span>
          <span className="font-medium">
            {formatTokenAmount(token1Amount, pool.token1.decimals, 6)}
          </span>
        </div>
        <div className="flex justify-between text-sm pt-2 border-t border-border">
          <span className="text-muted-foreground">LP Tokens</span>
          <span className="font-medium font-mono text-xs">
            {liquidity ? formatTokenAmount(liquidity, 18, 8) : "0"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href="/pools/add" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Add
          </Button>
        </Link>
        <Link href="/pools/remove" className="flex-1">
          <Button variant="outline" size="sm" className="w-full">
            Remove
          </Button>
        </Link>
      </div>
    </div>
  );
}

interface UserPositionsProps {
  positions?: UserPosition[];
  isLoading?: boolean;
}

export function UserPositions({ positions = [], isLoading }: UserPositionsProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">Connect your wallet</h3>
          <p className="text-sm text-muted-foreground">
            Connect your wallet to view your liquidity positions
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Your Positions</h2>
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="font-medium mb-2">No positions found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add liquidity to a pool to start earning fees
          </p>
          <Link href="/pools/add">
            <Button>Add Liquidity</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Positions</h2>
          <span className="text-sm text-muted-foreground">
            {positions.length} position{positions.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="space-y-3">
          {positions.map((position, index) => (
            <PositionRow key={index} position={position} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
