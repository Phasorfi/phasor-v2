"use client";

import React from "react";
import { Lock, Clock, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { VeNFT } from "@/types";
import { useVotingEscrow } from "@/hooks/useVotingEscrow";

interface VeNFTListProps {
  veNFTs: VeNFT[];
  isLoading: boolean;
  onRefresh?: () => void;
}

function VeNFTCard({ veNFT, onRefresh }: { veNFT: VeNFT; onRefresh?: () => void }) {
  const { withdraw, isLocking, isConfirming, error } = useVotingEscrow();
  const now = Math.floor(Date.now() / 1000);
  const isExpired = !veNFT.locked.isPermanent && veNFT.locked.end <= now;
  const timeRemaining = veNFT.locked.isPermanent ? Infinity : veNFT.locked.end - now;

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Expired";
    const days = Math.floor(seconds / 86400);
    if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
    if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
    if (days >= 1) return `${days}d`;
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const handleWithdraw = async () => {
    await withdraw(veNFT.tokenId);
    if (onRefresh) onRefresh();
  };

  return (
    <Card className={isExpired ? "border-amber-500/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Lock #{veNFT.tokenId.toString()}</CardTitle>
          <Badge variant={isExpired ? "destructive" : veNFT.locked.isPermanent ? "default" : "secondary"}>
            {isExpired ? "Expired" : veNFT.locked.isPermanent ? "Permanent" : formatTimeRemaining(timeRemaining)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" /> Locked
            </p>
            <p className="font-medium">
              {parseFloat(formatUnits(veNFT.locked.amount, 18)).toFixed(2)} PHASOR
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Zap className="h-3 w-3" /> Voting Power
            </p>
            <p className="font-medium">
              {parseFloat(formatUnits(veNFT.votingPower, 18)).toFixed(2)} vePHASOR
            </p>
          </div>
          <div className="col-span-2 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> Unlock Date
            </p>
            <p className="font-medium text-sm">
              {veNFT.locked.isPermanent ? "Permanent (no expiry)" : new Date(veNFT.locked.end * 1000).toLocaleDateString()}
            </p>
          </div>
        </div>

        {isExpired && !veNFT.locked.isPermanent && (
          <Button
            className="w-full"
            variant="outline"
            disabled={isLocking || isConfirming}
            onClick={handleWithdraw}
          >
            {isLocking || isConfirming ? "Withdrawing..." : "Withdraw PHASOR"}
          </Button>
        )}

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-3 w-3" /> {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function VeNFTList({ veNFTs, isLoading, onRefresh }: VeNFTListProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Connect your wallet to view your locks</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (veNFTs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">You don't have any locked PHASOR</p>
          <p className="text-sm text-muted-foreground">
            Lock PHASOR to receive vePHASOR voting power and boost your staking rewards
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {veNFTs.map((veNFT) => (
        <VeNFTCard key={veNFT.tokenId.toString()} veNFT={veNFT} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
