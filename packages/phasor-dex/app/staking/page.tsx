"use client";

import React, { useState, useEffect } from "react";
import { Coins, TrendingUp, Clock, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useStakingRewards } from "@/hooks/useStakingRewards";
import { StakeCard } from "@/components/staking/StakeCard";
import { RewardsCard } from "@/components/staking/RewardsCard";
import { BoostInfo } from "@/components/staking/BoostInfo";

function formatNumber(value: bigint, decimals: number = 18): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(4);
}

export default function StakingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { poolInfo, userStakeInfo, refetch } = useStakingRewards();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Staking</h1>
          <p className="text-muted-foreground mt-1">
            Stake LP tokens to earn PHASOR rewards with time and ve-boost multipliers
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Total Staked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(poolInfo?.totalSupply ?? BigInt(0))} LP</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Reward Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatNumber(poolInfo?.rewardRate ?? BigInt(0))}/s
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Your Stake
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : isConnected ? (
                <p className="text-2xl font-bold">{formatNumber(userStakeInfo?.balance ?? BigInt(0))} LP</p>
              ) : (
                <p className="text-muted-foreground">Connect wallet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Pending Rewards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : isConnected ? (
                <p className="text-2xl font-bold">{formatNumber(userStakeInfo?.pendingRewards ?? BigInt(0))} PHASOR</p>
              ) : (
                <p className="text-muted-foreground">Connect wallet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stake" className="space-y-6">
          <TabsList>
            <TabsTrigger value="stake">Stake</TabsTrigger>
            <TabsTrigger value="unstake">Unstake</TabsTrigger>
            <TabsTrigger value="rewards">Rewards</TabsTrigger>
          </TabsList>

          {/* Stake Tab */}
          <TabsContent value="stake" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <StakeCard mode="stake" onSuccess={refetch} />
              <BoostInfo userStakeInfo={userStakeInfo} />
            </div>
          </TabsContent>

          {/* Unstake Tab */}
          <TabsContent value="unstake" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <StakeCard mode="unstake" onSuccess={refetch} />
              <BoostInfo userStakeInfo={userStakeInfo} />
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <RewardsCard onSuccess={refetch} />
              <BoostInfo userStakeInfo={userStakeInfo} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
