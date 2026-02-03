"use client";

import React from "react";
import { Clock, Zap, TrendingUp, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAccount } from "wagmi";
import { UserStakeInfo } from "@/types";

interface BoostInfoProps {
  userStakeInfo: UserStakeInfo | null;
}

export function BoostInfo({ userStakeInfo }: BoostInfoProps) {
  const { isConnected } = useAccount();

  const timeMultiplier = Number(userStakeInfo?.timeMultiplier ?? BigInt(1e18)) / 1e18;
  const veBoost = Number(userStakeInfo?.veBoost ?? BigInt(1e18)) / 1e18;
  const totalMultiplier = Number(userStakeInfo?.totalMultiplier ?? BigInt(1e18)) / 1e18;

  // Time multiplier goes from 1x to 3x over 90 days
  const timeProgress = Math.min(((timeMultiplier - 1) / 2) * 100, 100);

  // Ve boost goes from 1x (0.4 base) to 2.5x max
  const veProgress = Math.min(((veBoost - 1) / 1.5) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Boost Multipliers
        </CardTitle>
        <CardDescription>
          Your reward multipliers based on staking duration and vePHASOR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect wallet to view your boosts</p>
          </div>
        ) : (
          <>
            {/* Time Multiplier */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Time Multiplier</span>
                </div>
                <span className="text-sm font-bold">{timeMultiplier.toFixed(2)}x</span>
              </div>
              <Progress value={timeProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Increases from 1x to 3x over 90 days of staking
              </p>
            </div>

            {/* Ve Boost */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">vePHASOR Boost</span>
                </div>
                <span className="text-sm font-bold">{veBoost.toFixed(2)}x</span>
              </div>
              <Progress value={veProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Up to 2.5x boost based on your vePHASOR voting power
              </p>
            </div>

            {/* Total */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Multiplier</span>
                <span className="text-2xl font-bold">{totalMultiplier.toFixed(2)}x</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum possible: 7.5x (3x time × 2.5x ve)
              </p>
            </div>

            {/* Info */}
            <div className="flex gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">How boosts work:</p>
                <ul className="space-y-1">
                  <li>• Time boost: Rewards increase the longer you stake</li>
                  <li>• ve-boost: Lock PHASOR as vePHASOR for additional rewards</li>
                  <li>• Boosts multiply together for maximum earnings</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
