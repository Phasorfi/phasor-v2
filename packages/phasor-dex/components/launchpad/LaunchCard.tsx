"use client";

import React from "react";
import Link from "next/link";
import { Clock, TrendingUp, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Address, formatUnits } from "viem";
import { useFairLaunch } from "@/hooks/useLaunchpad";
import { LaunchState, AUCTION_TYPE_LABELS } from "@/types";

interface LaunchCardProps {
  launchAddress: Address;
  filterState?: "active" | "pending" | "ended";
}

const STATE_COLORS: Record<LaunchState, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  success: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
  finalized: "bg-purple-500/10 text-purple-500 border-purple-500/20",
};

const STATE_LABELS: Record<LaunchState, string> = {
  pending: "Upcoming",
  active: "Live",
  success: "Successful",
  failed: "Failed",
  finalized: "Finalized",
};

export function LaunchCard({ launchAddress, filterState }: LaunchCardProps) {
  const { launchInfo } = useFairLaunch(launchAddress);

  if (!launchInfo) {
    return <Skeleton className="h-64" />;
  }

  // Filter based on state
  if (filterState) {
    if (filterState === "active" && launchInfo.state !== "active") return null;
    if (filterState === "pending" && launchInfo.state !== "pending") return null;
    if (filterState === "ended" && !["success", "failed", "finalized"].includes(launchInfo.state)) return null;
  }

  const { auctionInfo, auctionStatus, state } = launchInfo;

  // For Crowdsale, show progress toward goal; otherwise show total committed
  const hasGoal = auctionInfo.auctionType === 1 && auctionInfo.goal > BigInt(0);
  const progress = hasGoal
    ? Math.min(Number((auctionStatus.commitmentsTotal * BigInt(100)) / auctionInfo.goal), 100)
    : 0;

  const getTimeRemaining = (): string => {
    const now = Math.floor(Date.now() / 1000);
    if (state === "pending") {
      const diff = auctionInfo.startTime - now;
      if (diff <= 0) return "Starting...";
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      return `${hours}h ${mins}m`;
    }
    if (state === "active") {
      const diff = auctionInfo.endTime - now;
      if (diff <= 0) return "Ending...";
      const hours = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
      return `${hours}h ${mins}m`;
    }
    return "";
  };

  return (
    <Link href={`/launchpad/${launchAddress}`}>
      <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                {AUCTION_TYPE_LABELS[auctionInfo.auctionType] ?? "Auction"}
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {launchAddress.slice(0, 6)}...{launchAddress.slice(-4)}
              </p>
            </div>
            <Badge variant="outline" className={STATE_COLORS[state]}>
              {STATE_LABELS[state]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress / Total Committed */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Committed</span>
              <span className="font-medium">
                {parseFloat(formatUnits(auctionStatus.commitmentsTotal, 18)).toFixed(4)}
                {hasGoal && ` / ${parseFloat(formatUnits(auctionInfo.goal, 18)).toFixed(2)}`}
              </span>
            </div>
            {hasGoal && <Progress value={progress} className="h-2" />}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>{parseFloat(formatUnits(auctionInfo.totalTokens, 18)).toFixed(0)} tokens</span>
            </div>
            {auctionStatus.tokenPrice > BigInt(0) && (
              <div className="text-muted-foreground">
                Price: {parseFloat(formatUnits(auctionStatus.tokenPrice, 18)).toFixed(6)}
              </div>
            )}
          </div>

          {/* Time */}
          {(state === "pending" || state === "active") && (
            <div className="flex items-center justify-between pt-2 border-t text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{state === "pending" ? "Starts in" : "Ends in"}</span>
              </div>
              <span className="font-medium">{getTimeRemaining()}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
