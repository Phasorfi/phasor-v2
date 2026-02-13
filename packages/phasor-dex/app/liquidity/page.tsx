"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PoolCard, EmptyPoolState } from "@/components/pool/PoolCard";
import { UserPositions } from "@/components/pool/UserPositions";
import { usePoolsHybrid } from "@/hooks/usePoolsHybrid";
import { useUserPositions } from "@/hooks/useUserPositions";

export default function LiquidityPage() {
  const [search, setSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const { pools, isLoading } = usePoolsHybrid();
  const { positions, isLoading: isPositionsLoading } = useUserPositions();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const filteredPools = useMemo(() => {
    if (!search) return pools;
    const q = search.toLowerCase();
    return pools.filter(
      (pool) =>
        pool.token0.symbol.toLowerCase().includes(q) ||
        pool.token1.symbol.toLowerCase().includes(q) ||
        pool.token0.name.toLowerCase().includes(q) ||
        pool.token1.name.toLowerCase().includes(q)
    );
  }, [pools, search]);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Liquidity</h1>
            <p className="text-muted-foreground mt-1">
              Provide liquidity, stake LP tokens, and earn rewards
            </p>
          </div>
          <Link href="/pools/add">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              New Position
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All Pools</TabsTrigger>
              <TabsTrigger value="my">
                My Positions {positions.length > 0 && `(${positions.length})`}
              </TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pools..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* All Pools */}
          <TabsContent value="all" className="space-y-4">
            {!isMounted || isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : filteredPools.length === 0 ? (
              <EmptyPoolState />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredPools.map((pool) => (
                  <PoolCard key={pool.address} pool={pool} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Positions */}
          <TabsContent value="my" className="space-y-4">
            <UserPositions positions={positions} isLoading={isPositionsLoading} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
