"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, TrendingUp, Coins, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useSale } from "@/hooks/useLaunchpad";
import { ContributeCard } from "@/components/launchpad/ContributeCard";
import { ClaimCard } from "@/components/launchpad/ClaimCard";
import { SaleState } from "@/types";

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

export default function SaleDetailPage() {
  const params = useParams();
  const saleId = params.saleId !== undefined ? Number(params.saleId) : null;
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { sale, saleState, tokenMeta, baseTokenMeta, userSaleInfo, refetch } = useSale(saleId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !sale) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const baseDecimals = baseTokenMeta?.decimals ?? 18;
  const tokenDecimals = tokenMeta?.decimals ?? 18;
  const baseSymbol = baseTokenMeta?.symbol ?? "";
  const progress = sale.hardCap > BigInt(0)
    ? Math.min(Number((sale.raised * BigInt(100)) / sale.hardCap), 100)
    : 0;

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link href="/launchpad" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Launchpad
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">
              {tokenMeta?.name ?? `Sale #${saleId}`}
            </h1>
            <p className="text-muted-foreground mt-1">
              {tokenMeta?.symbol ?? "Token"} Sale
            </p>
          </div>
          <Badge variant="outline" className={`${STATE_COLORS[saleState]} text-lg px-4 py-2`}>
            {STATE_LABELS[saleState]}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Sale Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {parseFloat(formatUnits(sale.raised, baseDecimals)).toFixed(4)} {baseSymbol}
                </span>
                <span className="text-2xl text-muted-foreground">
                  / {parseFloat(formatUnits(sale.hardCap, baseDecimals)).toFixed(2)} {baseSymbol}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Soft cap: {parseFloat(formatUnits(sale.softCap, baseDecimals)).toFixed(2)} {baseSymbol}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{parseFloat(formatUnits(sale.tokenAmount, tokenDecimals)).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4" /> Tokens for Sale
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {parseFloat(formatUnits(sale.price, baseDecimals)).toFixed(6)}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" /> Price ({baseSymbol})
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {saleState === "active" ? "Live" : saleState === "pending" ? "Soon" : STATE_LABELS[saleState]}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" /> Status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Sale Info */}
          <Card>
            <CardHeader>
              <CardTitle>Sale Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Sale Token</span>
                <span className="font-medium">{tokenMeta?.symbol ?? sale.token.slice(0, 10) + "..."}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Payment Token</span>
                <span className="font-medium">{baseSymbol || sale.baseToken.slice(0, 10) + "..."}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Start Time</span>
                <span className="font-medium">{formatDate(sale.startTime)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-medium">{formatDate(sale.endTime)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Requires veNFT</span>
                <span className="font-medium">Yes</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          {saleState === "active" && saleId !== null ? (
            <ContributeCard saleId={saleId} onSuccess={refetch} />
          ) : (saleState === "finalized" || saleState === "success") && saleId !== null ? (
            <ClaimCard saleId={saleId} onSuccess={refetch} />
          ) : (saleState === "failed" || saleState === "cancelled") && saleId !== null ? (
            <ClaimCard saleId={saleId} isRefund onSuccess={refetch} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Participate</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                {saleState === "pending" ? (
                  <>
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Sale has not started yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Starts: {formatDate(sale.startTime)}
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Sale has ended</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* User Info */}
        {isConnected && userSaleInfo && userSaleInfo.contribution > BigInt(0) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {parseFloat(formatUnits(userSaleInfo.contribution, baseDecimals)).toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground">Contributed ({baseSymbol})</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {sale.raised > BigInt(0)
                      ? parseFloat(formatUnits((userSaleInfo.contribution * sale.tokenAmount) / sale.raised, tokenDecimals)).toFixed(4)
                      : "0"}
                  </p>
                  <p className="text-sm text-muted-foreground">Est. Tokens</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
