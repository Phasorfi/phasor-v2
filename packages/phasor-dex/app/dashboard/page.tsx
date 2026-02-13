"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Lock, Zap, Gift, Coins, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useVotingEscrow } from "@/hooks/useVotingEscrow";
import { useRewards } from "@/hooks/useRewards";
import { useUserPositions } from "@/hooks/useUserPositions";
import { useStakingRewards } from "@/hooks/useStakingRewards";

function formatNumber(value: bigint, decimals: number = 18): string {
  const num = Number(formatUnits(value, decimals));
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(2);
}

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { isConnected } = useAccount();
  const {
    userVeNFTs, totalLocked, totalVotingPower, phasorBalance,
    isLoading: isVeLoading,
  } = useVotingEscrow();

  const tokenIds = useMemo(() => userVeNFTs.map((n) => n.tokenId), [userVeNFTs]);
  const {
    rebaseRewards, totalRebaseClaimable,
    isClaiming, claimAllRebase,
  } = useRewards(tokenIds);

  const { positions, isLoading: isPositionsLoading } = useUserPositions();
  const { userStakeInfo, poolInfo } = useStakingRewards();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userTotalVotingPower = userVeNFTs.reduce((sum, nft) => sum + nft.votingPower, BigInt(0));
  const userTotalLocked = userVeNFTs.reduce((sum, nft) => sum + nft.locked.amount, BigInt(0));

  if (!isMounted) {
    return (
      <div className="container py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your positions and rewards
          </p>
        </div>

        {!isConnected ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Connect your wallet to view your dashboard</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Zap className="h-4 w-4" /> Voting Power
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(userTotalVotingPower)}</p>
                  <p className="text-xs text-muted-foreground">vePHASOR</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Total Locked
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(userTotalLocked)}</p>
                  <p className="text-xs text-muted-foreground">PHASOR</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Gift className="h-4 w-4" /> Rebase Rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{formatNumber(totalRebaseClaimable)}</p>
                  <p className="text-xs text-muted-foreground">PHASOR claimable</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="flex items-center gap-2">
                    <Coins className="h-4 w-4" /> Staking Rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(userStakeInfo?.pendingRewards ?? BigInt(0))}
                  </p>
                  <p className="text-xs text-muted-foreground">PHASOR pending</p>
                </CardContent>
              </Card>
            </div>

            {/* veNFT Positions */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>veNFT Positions</CardTitle>
                  <Link href="/governance">
                    <Button variant="outline" size="sm">
                      Manage <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isVeLoading ? (
                  <Skeleton className="h-16" />
                ) : userVeNFTs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No veNFTs. Lock PHASOR to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {userVeNFTs.map((nft) => (
                      <div key={nft.tokenId.toString()} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <span className="font-medium">Lock #{nft.tokenId.toString()}</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {parseFloat(formatUnits(nft.locked.amount, 18)).toFixed(2)} PHASOR
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {parseFloat(formatUnits(nft.votingPower, 18)).toFixed(2)} vePHASOR
                          </span>
                          {nft.locked.isPermanent && (
                            <Badge variant="default" className="text-xs">Permanent</Badge>
                          )}
                          {nft.voted && (
                            <Badge variant="outline" className="text-xs">Voted</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Claimable Rewards */}
            {totalRebaseClaimable > BigInt(0) && (
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Claimable Rebase Rewards</CardTitle>
                    <Button
                      size="sm"
                      disabled={isClaiming}
                      onClick={claimAllRebase}
                    >
                      {isClaiming ? "Claiming..." : "Claim All"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {rebaseRewards
                      .filter((r) => r.claimable > BigInt(0))
                      .map((reward) => (
                        <div key={reward.tokenId.toString()} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <span className="text-sm">Lock #{reward.tokenId.toString()}</span>
                          <span className="font-medium">
                            {parseFloat(formatUnits(reward.claimable, 18)).toFixed(4)} PHASOR
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* LP Positions */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>LP Positions</CardTitle>
                  <Link href="/liquidity">
                    <Button variant="outline" size="sm">
                      Manage <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {isPositionsLoading ? (
                  <Skeleton className="h-16" />
                ) : positions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No LP positions. Add liquidity to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {positions.map((pos) => (
                      <div key={pos.pool.address} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <span className="font-medium">
                          {pos.pool.token0.symbol}/{pos.pool.token1.symbol}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {pos.share.toFixed(4)}% share
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Staking Summary */}
            {userStakeInfo && userStakeInfo.balance > BigInt(0) && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Staking</CardTitle>
                    <Link href="/staking">
                      <Button variant="outline" size="sm">
                        Manage <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Staked</p>
                      <p className="font-medium">{formatNumber(userStakeInfo.balance)} LP</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Rewards</p>
                      <p className="font-medium">{formatNumber(userStakeInfo.pendingRewards)} PHASOR</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
