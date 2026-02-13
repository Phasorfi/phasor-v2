"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";
import { Pool } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PoolDetailHeaderProps {
  pool: Pool;
}

export function PoolDetailHeader({ pool }: PoolDetailHeaderProps) {
  const { token0, token1, apr, address } = pool;

  // Format APR percentage
  const formatAPR = (value: number | undefined) => {
    if (value === undefined) return null;
    if (value === 0) return "0%";
    return `${value.toFixed(2)}%`;
  };

  // Get explorer URL
  const getExplorerUrl = () => {
    return `https://testnet.monadvision.com/address/${address}`;
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Token Pair Info */}
          <div className="flex items-center gap-4">
            {/* Token Icons */}
            <div className="flex -space-x-3">
              <div className="w-12 h-12 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden z-10">
                {token0.logoURI ? (
                  <Image
                    src={token0.logoURI}
                    alt={token0.symbol}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {token0.symbol.charAt(0)}
                  </span>
                )}
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary border-4 border-card flex items-center justify-center overflow-hidden">
                {token1.logoURI ? (
                  <Image
                    src={token1.logoURI}
                    alt={token1.symbol}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold">
                    {token1.symbol.charAt(0)}
                  </span>
                )}
              </div>
            </div>

            {/* Token Names */}
            <div>
              <h1 className="text-2xl font-bold">
                {token0.symbol} / {token1.symbol}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>0.3% fee tier</span>
                <span>•</span>
                <a
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Actions and APR */}
          <div className="flex items-center gap-3">
            {/* APR Badge */}
            {formatAPR(apr) && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-500">
                <TrendingUp className="h-4 w-4" />
                <div className="text-right">
                  <div className="text-xs text-green-500/70">APR</div>
                  <div className="font-semibold">{formatAPR(apr)}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Link href={`/pools/add?token0=${token0.address}&token1=${token1.address}`}>
                <Button variant="outline">Add Liquidity</Button>
              </Link>
              <Link href={`/swap?inputCurrency=${token0.address}&outputCurrency=${token1.address}`}>
                <Button>Swap</Button>
              </Link>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
