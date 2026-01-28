"use client";

import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortfolioStatsProps {
  totalValue: number;
  change24h: number;
  change24hPercent: number;
  tokenValue: number;
  lpValue: number;
}

export function PortfolioStats({
  totalValue,
  change24h,
  change24hPercent,
  tokenValue,
  lpValue,
}: PortfolioStatsProps) {
  const isPositive = change24h >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Value */}
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Total Value</div>
        <div className="text-3xl font-bold mb-1">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={cn("flex items-center gap-1 text-sm", isPositive ? "text-green-500" : "text-red-500")}>
          {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
          <span>
            ${Math.abs(change24h).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            {" "}({change24hPercent >= 0 ? "+" : ""}{change24hPercent.toFixed(2)}%)
          </span>
        </div>
      </Card>

      {/* 24h Change */}
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">24h Change</div>
        <div className={cn("text-3xl font-bold", isPositive ? "text-green-500" : "text-red-500")}>
          {change24hPercent >= 0 ? "+" : ""}{change24hPercent.toFixed(2)}%
        </div>
        <div className="text-sm text-muted-foreground">
          {isPositive ? "+" : ""}${change24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </Card>

      {/* Token Value */}
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">Token Value</div>
        <div className="text-3xl font-bold">
          ${tokenValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalValue > 0 ? ((tokenValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
        </div>
      </Card>

      {/* LP Value */}
      <Card className="p-6">
        <div className="text-sm text-muted-foreground mb-1">LP Positions</div>
        <div className="text-3xl font-bold">
          ${lpValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className="text-sm text-muted-foreground">
          {totalValue > 0 ? ((lpValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
        </div>
      </Card>
    </div>
  );
}
