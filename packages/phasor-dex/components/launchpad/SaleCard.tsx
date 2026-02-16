"use client";

import React from "react";
import Link from "next/link";
import { Clock, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatUnits } from "viem";
import { SaleInfo, SaleState, SaleTokenMeta } from "@/types";

interface SaleCardProps {
  sale: SaleInfo;
  saleState: SaleState;
  tokenMeta?: SaleTokenMeta;
  baseTokenMeta?: SaleTokenMeta;
}

const STATE_COLORS: Record<SaleState, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  success: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  finalized: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const STATE_LABELS: Record<SaleState, string> = {
  pending: "Upcoming",
  active: "Live",
  success: "Successful",
  failed: "Failed",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

export function SaleCard({ sale, saleState, tokenMeta, baseTokenMeta }: SaleCardProps) {
  const baseDecimals = baseTokenMeta?.decimals ?? 18;
  const tokenDecimals = tokenMeta?.decimals ?? 18;
  const progress = sale.hardCap > BigInt(0)
    ? Math.min(Number((sale.raised * BigInt(100)) / sale.hardCap), 100)
    : 0;

  const getTimeRemaining = (): string => {
    const now = Math.floor(Date.now() / 1000);
    if (saleState === "pending") {
      const diff = sale.startTime - now;
      if (diff <= 0) return "Starting...";
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      return `${hours}h ${mins}m`;
    }
    if (saleState === "active") {
      const diff = sale.endTime - now;
      if (diff <= 0) return "Ending...";
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      return `${hours}h ${mins}m`;
    }
    return "";
  };

  return (
    <Link href={`/launchpad/${sale.saleId}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {tokenMeta?.symbol ?? "Token"} Sale
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {tokenMeta?.name ?? `Sale #${sale.saleId}`}
              </p>
            </div>
            <Badge variant="outline" className={STATE_COLORS[saleState]}>
              {STATE_LABELS[saleState]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Raised</span>
              <span className="font-medium">
                {parseFloat(formatUnits(sale.raised, baseDecimals)).toFixed(4)}
                {" / "}
                {parseFloat(formatUnits(sale.hardCap, baseDecimals)).toFixed(2)}
                {baseTokenMeta ? ` ${baseTokenMeta.symbol}` : ""}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{parseFloat(formatUnits(sale.tokenAmount, tokenDecimals)).toFixed(0)} {tokenMeta?.symbol ?? "tokens"}</span>
            </div>
            <div className="text-muted-foreground">
              Price: {parseFloat(formatUnits(sale.price, baseDecimals)).toFixed(6)}
            </div>
          </div>

          {/* Time */}
          {(saleState === "pending" || saleState === "active") && (
            <div className="flex items-center justify-between pt-2 border-t text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{saleState === "pending" ? "Starts in" : "Ends in"}</span>
              </div>
              <span className="font-medium">{getTimeRemaining()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
