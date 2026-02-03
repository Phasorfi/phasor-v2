"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, Users, TrendingUp, Coins, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Address, formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useFairLaunch } from "@/hooks/useLaunchpad";
import { ContributeCard } from "@/components/launchpad/ContributeCard";
import { ClaimCard } from "@/components/launchpad/ClaimCard";
import { LaunchState } from "@/types";

const STATE_COLORS: Record<LaunchState, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  success: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  finalized: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

const STATE_LABELS: Record<LaunchState, string> = {
  pending: "Upcoming",
  active: "Live",
  success: "Successful",
  failed: "Failed",
  finalized: "Finalized",
  cancelled: "Cancelled",
};

export default function LaunchDetailPage() {
  const params = useParams();
  const launchAddress = params.address as Address;
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { launchInfo, userLaunchInfo, refetch } = useFairLaunch(launchAddress);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !launchInfo) {
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

  const { saleInfo, saleStatus, state } = launchInfo;
  const progress = saleInfo.hardCap > BigInt(0)
    ? Number((saleStatus.totalRaised * BigInt(100)) / saleInfo.hardCap)
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
            <h1 className="text-3xl font-display font-bold">Token Sale</h1>
            <p className="text-muted-foreground mt-1 font-mono text-sm">
              {launchAddress}
            </p>
          </div>
          <Badge variant="outline" className={`${STATE_COLORS[state]} text-lg px-4 py-2`}>
            {STATE_LABELS[state]}
          </Badge>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Fundraising Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">
                  {parseFloat(formatUnits(saleStatus.totalRaised, 18)).toFixed(4)}
                </span>
                <span className="text-2xl text-muted-foreground">
                  / {parseFloat(formatUnits(saleInfo.hardCap, 18)).toFixed(2)}
                </span>
              </div>
              <Progress value={progress} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Soft cap: {parseFloat(formatUnits(saleInfo.softCap, 18)).toFixed(0)}</span>
                <span>{progress.toFixed(1)}% raised</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold">{saleStatus.totalParticipants}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-4 w-4" /> Participants
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{parseFloat(formatUnits(saleInfo.totalTokens, 18)).toFixed(0)}</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Coins className="h-4 w-4" /> Tokens
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{(launchInfo.liquidityBps / 100).toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <TrendingUp className="h-4 w-4" /> To Liquidity
                </p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">
                  {saleInfo.vestingDuration > 0 ? `${Math.floor(saleInfo.vestingDuration / 86400)}d` : "None"}
                </p>
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-4 w-4" /> Vesting
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
                <span className="text-muted-foreground">Start Time</span>
                <span className="font-medium">{formatDate(saleInfo.startTime)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">End Time</span>
                <span className="font-medium">{formatDate(saleInfo.endTime)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Soft Cap</span>
                <span className="font-medium">{parseFloat(formatUnits(saleInfo.softCap, 18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Hard Cap</span>
                <span className="font-medium">{parseFloat(formatUnits(saleInfo.hardCap, 18)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Sale Token</span>
                <span className="font-mono text-sm">{saleInfo.saleToken.slice(0, 10)}...</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Card */}
          {state === "active" ? (
            <ContributeCard launchAddress={launchAddress} onSuccess={refetch} />
          ) : state === "finalized" || (state === "success" && saleStatus.finalized) ? (
            <ClaimCard launchAddress={launchAddress} onSuccess={refetch} />
          ) : state === "failed" || state === "cancelled" ? (
            <ClaimCard launchAddress={launchAddress} isRefund onSuccess={refetch} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Participate</CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center">
                {state === "pending" ? (
                  <>
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Sale has not started yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Starts: {formatDate(saleInfo.startTime)}
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
        {isConnected && userLaunchInfo && userLaunchInfo.commitment > BigInt(0) && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your Participation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">
                    {parseFloat(formatUnits(userLaunchInfo.commitment, 18)).toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground">Committed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {parseFloat(formatUnits(userLaunchInfo.allocation, 18)).toFixed(4)}
                  </p>
                  <p className="text-sm text-muted-foreground">Allocation</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {userLaunchInfo.claimed ? "Yes" : "No"}
                  </p>
                  <p className="text-sm text-muted-foreground">Claimed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
