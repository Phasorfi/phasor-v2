"use client";

import React from "react";
import { Clock, TrendingUp, Info } from "lucide-react";
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

  // Time multiplier goes from 1x to 3x over 90 days
  const timeProgress = Math.min(((timeMultiplier - 1) / 2) * 100, 100);

  const firstStakeTime = userStakeInfo?.firstStakeTime ?? 0;
  const daysStaked = firstStakeTime > 0
    ? Math.floor((Date.now() / 1000 - firstStakeTime) / 86400)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Time Boost
        </CardTitle>
        <CardDescription>
          Your reward multiplier based on staking duration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect wallet to view your boost</p>
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
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Increases from 1x to 3x over 90 days</span>
                {daysStaked > 0 && <span>{daysStaked} day{daysStaked !== 1 ? "s" : ""} staked</span>}
              </div>
            </div>

            {/* Current Multiplier */}
            <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <span className="font-medium">Your Multiplier</span>
                <span className="text-2xl font-bold">{timeMultiplier.toFixed(2)}x</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Maximum possible: 3.0x after 90 days
              </p>
            </div>

            {/* Info */}
            <div className="flex gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">How time boost works:</p>
                <ul className="space-y-1">
                  <li>- Rewards increase the longer you keep LP tokens staked</li>
                  <li>- Starts at 1x and linearly grows to 3x over 90 days</li>
                  <li>- Withdrawing resets your multiplier</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
