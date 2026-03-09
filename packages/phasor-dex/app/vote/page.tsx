"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Vote, Clock, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "wagmi";
import { Address, formatUnits } from "viem";
import { useVoter } from "@/hooks/useVoter";
import { useVotingEscrow } from "@/hooks/useVotingEscrow";

export default function VotePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedNFTId, setSelectedNFTId] = useState<string>("");
  const [allocations, setAllocations] = useState<Record<string, string>>({});
  const { isConnected } = useAccount();
  const { userVeNFTs } = useVotingEscrow();

  const tokenId = selectedNFTId ? BigInt(selectedNFTId) : undefined;
  const {
    poolVoteInfos, totalWeight, epochInfo, usedWeights, lastVoted,
    isVoting, vote, reset, poke, error,
  } = useVoter(tokenId);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-select first NFT
  useEffect(() => {
    if (userVeNFTs.length > 0 && !selectedNFTId) {
      setSelectedNFTId(userVeNFTs[0].tokenId.toString());
    }
  }, [userVeNFTs, selectedNFTId]);

  const selectedNFT = useMemo(() => {
    return userVeNFTs.find((n) => n.tokenId.toString() === selectedNFTId);
  }, [userVeNFTs, selectedNFTId]);

  const filteredPools = useMemo(() => {
    if (!search) return poolVoteInfos;
    const q = search.toLowerCase();
    return poolVoteInfos.filter(
      (p) =>
        p.token0Symbol.toLowerCase().includes(q) ||
        p.token1Symbol.toLowerCase().includes(q)
    );
  }, [poolVoteInfos, search]);

  const totalAllocation = useMemo(() => {
    return Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [allocations]);

  const handleCastVotes = async () => {
    if (!tokenId) return;
    const pools: Address[] = [];
    const weights: bigint[] = [];
    Object.entries(allocations).forEach(([pool, weight]) => {
      const w = parseFloat(weight);
      if (w > 0) {
        pools.push(pool as Address);
        weights.push(BigInt(Math.floor(w * 100))); // basis points
      }
    });
    if (pools.length > 0) {
      await vote(tokenId, pools, weights);
      setAllocations({});
    }
  };

  const handleReset = async () => {
    if (!tokenId) return;
    await reset(tokenId);
  };

  const now = Math.floor(Date.now() / 1000);
  const epochTimeRemaining = epochInfo ? epochInfo.epochEnd - now : 0;
  const formatCountdown = (seconds: number): string => {
    if (seconds <= 0) return "Epoch ended";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Vote</h1>
          <p className="text-muted-foreground mt-1">
            Allocate your voting power to pools to direct emissions
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Vote className="h-4 w-4" /> Total Vote Weight
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">
                  {parseFloat(formatUnits(totalWeight, 18)).toFixed(2)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Your Voting Power</CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : isConnected && selectedNFT ? (
                <p className="text-2xl font-bold">
                  {parseFloat(formatUnits(selectedNFT.votingPower, 18)).toFixed(2)} vePHASOR
                </p>
              ) : (
                <p className="text-muted-foreground">Select a veNFT</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Next Epoch
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isMounted ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{formatCountdown(epochTimeRemaining)}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* veNFT Selector */}
        {isConnected && userVeNFTs.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Select value={selectedNFTId} onValueChange={setSelectedNFTId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select veNFT to vote with" />
                </SelectTrigger>
                <SelectContent>
                  {userVeNFTs.map((nft) => (
                    <SelectItem key={nft.tokenId.toString()} value={nft.tokenId.toString()}>
                      Lock #{nft.tokenId.toString()} - {parseFloat(formatUnits(nft.votingPower, 18)).toFixed(2)} vePHASOR
                      {nft.voted ? " (Voted)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCastVotes}
                disabled={isVoting || totalAllocation === 0 || !tokenId}
              >
                {isVoting ? "Voting..." : "Cast Votes"}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={isVoting || !tokenId}>
                <RefreshCw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </div>
        )}

        {!isConnected && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Connect your wallet and lock PHASOR to vote</p>
            </CardContent>
          </Card>
        )}

        {isConnected && userVeNFTs.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-2">No veNFTs found</p>
              <p className="text-sm text-muted-foreground">Lock PHASOR on the Lock page to get voting power</p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative w-full md:w-64 mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search pools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Allocation indicator */}
        {totalAllocation > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center justify-between">
            <span className="text-sm">Total allocation: <strong>{totalAllocation.toFixed(1)}%</strong></span>
            {totalAllocation > 100 && (
              <Badge variant="destructive">Over 100%</Badge>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive mb-4">{error}</p>
        )}

        {/* Pool Voting Table */}
        <div className="space-y-3">
          {!isMounted ? (
            <>
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </>
          ) : filteredPools.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No pools with gauges found</p>
              </CardContent>
            </Card>
          ) : (
            filteredPools.map((pool) => (
              <Card key={pool.pool} className="hover:border-primary/30 transition-colors">
                <CardContent className="py-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Pool info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {pool.token0Symbol}/{pool.token1Symbol}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {pool.isStable ? "Stable" : "Volatile"}
                        </Badge>
                        {!pool.isAlive && (
                          <Badge variant="destructive" className="text-xs">Killed</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Weight: {pool.weightPercent.toFixed(2)}%
                        {pool.userVote > BigInt(0) && (
                          <span className="ml-2 text-blue-500">
                            Your vote: {parseFloat(formatUnits(pool.userVote, 18)).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Vote allocation input */}
                    {isConnected && selectedNFT && pool.isAlive && (
                      <div className="flex items-center gap-2 w-32">
                        <Input
                          type="number"
                          placeholder="0"
                          value={allocations[pool.pool] ?? ""}
                          onChange={(e) =>
                            setAllocations((prev) => ({
                              ...prev,
                              [pool.pool]: e.target.value,
                            }))
                          }
                          className="text-right"
                          min="0"
                          max="100"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
