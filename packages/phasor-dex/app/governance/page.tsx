"use client";

import React, { useState, useEffect } from "react";
import { Lock, Clock, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useVotingEscrow } from "@/hooks/useVotingEscrow";
import { LockCard } from "@/components/governance/LockCard";
import { VeNFTList } from "@/components/governance/VeNFTList";

function formatNumber(value: bigint, decimals: number = 18): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export default function GovernancePage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const { totalLocked, totalVotingPower, userVeNFTs, phasorBalance, isLoading, refetch } = useVotingEscrow();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userTotalVotingPower = userVeNFTs.reduce((sum, nft) => sum + nft.votingPower, BigInt(0));
  const userTotalLocked = userVeNFTs.reduce((sum, nft) => sum + nft.locked.amount, BigInt(0));

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Lock</h1>
          <p className="text-muted-foreground mt-1">
            Lock PHASOR to receive vePHASOR voting power and earn rewards
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Total Locked
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(totalLocked)} PHASOR</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Total Voting Power
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatNumber(totalVotingPower)} vePHASOR</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Your Voting Power
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : isConnected ? (
                <p className="text-2xl font-bold">{formatNumber(userTotalVotingPower)} vePHASOR</p>
              ) : (
                <p className="text-muted-foreground">Connect wallet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lock" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lock">Lock PHASOR</TabsTrigger>
            <TabsTrigger value="positions">
              My Locks {userVeNFTs.length > 0 && `(${userVeNFTs.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Lock Tab */}
          <TabsContent value="lock" className="space-y-4">
            <LockCard onSuccess={refetch} />
          </TabsContent>

          {/* My Locks Tab */}
          <TabsContent value="positions" className="space-y-4">
            <VeNFTList veNFTs={userVeNFTs} isLoading={isLoading} onRefresh={refetch} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
