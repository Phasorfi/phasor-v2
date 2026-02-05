"use client";

import React from "react";
import { Gift, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useStakingRewards } from "@/hooks/useStakingRewards";

interface RewardsCardProps {
  onSuccess?: () => void;
}

export function RewardsCard({ onSuccess }: RewardsCardProps) {
  const { isConnected } = useAccount();
  const { userStakeInfo, claimRewards, isStaking, isConfirming, error } = useStakingRewards();

  const pendingRewards = userStakeInfo?.pendingRewards ?? BigInt(0);
  const stakedBalance = userStakeInfo?.balance ?? BigInt(0);
  const hasRewards = pendingRewards > BigInt(0);

  const handleClaim = async () => {
    await claimRewards();
    if (onSuccess) onSuccess();
  };

  const timeMultiplier = Number(userStakeInfo?.timeMultiplier ?? BigInt(1e18)) / 1e18;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Claim Rewards
        </CardTitle>
        <CardDescription>
          Claim your pending PHASOR rewards
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pending Rewards */}
        <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-center">
          <p className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
            <Zap className="h-4 w-4" />
            Pending Rewards
          </p>
          <p className="text-4xl font-bold">
            {parseFloat(formatUnits(pendingRewards, 18)).toFixed(4)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">PHASOR</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Staked Balance</p>
            <p className="font-medium">{parseFloat(formatUnits(stakedBalance, 18)).toFixed(4)} LP</p>
          </div>
          <div>
            <p className="text-muted-foreground">Time Multiplier</p>
            <p className="font-medium">{timeMultiplier.toFixed(2)}x</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Claim Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={!isConnected || !hasRewards || isStaking || isConfirming}
          onClick={handleClaim}
        >
          {isStaking || isConfirming ? "Claiming..." : "Claim Rewards"}
        </Button>
      </CardContent>
    </Card>
  );
}
