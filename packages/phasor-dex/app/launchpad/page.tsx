"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Rocket, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useLaunchpad, LaunchpadSale } from "@/hooks/useLaunchpad";
import { SaleCard } from "@/components/launchpad/SaleCard";

export default function LaunchpadPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");
  const { sales, saleCount, isLoading } = useLaunchpad();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter by search and tab
  const filterSales = (tab: "all" | "active" | "upcoming" | "ended") => {
    let filtered = sales;

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.tokenMeta?.symbol.toLowerCase().includes(q) ||
          s.tokenMeta?.name.toLowerCase().includes(q) ||
          s.baseTokenMeta?.symbol.toLowerCase().includes(q) ||
          s.sale.token.toLowerCase().includes(q)
      );
    }

    // Tab filter
    if (tab === "active") return filtered.filter((s) => s.state === "active");
    if (tab === "upcoming") return filtered.filter((s) => s.state === "pending");
    if (tab === "ended") return filtered.filter((s) => ["success", "failed", "finalized", "cancelled"].includes(s.state));
    return filtered;
  };

  const renderSaleGrid = (filteredSales: LaunchpadSale[]) => {
    if (!isMounted || isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      );
    }

    if (filteredSales.length === 0) {
      return <EmptyLaunchState />;
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {filteredSales.map((s) => (
          <SaleCard
            key={s.sale.saleId}
            sale={s.sale}
            saleState={s.state}
            tokenMeta={s.tokenMeta}
            baseTokenMeta={s.baseTokenMeta}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Launchpad</h1>
            <p className="text-muted-foreground mt-1">
              Participate in ve-gated token sales
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="h-5 w-5" />
            <span>{saleCount} sales</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All Sales</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ended">Ended</TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sales..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            {renderSaleGrid(filterSales("all"))}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {renderSaleGrid(filterSales("active"))}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {renderSaleGrid(filterSales("upcoming"))}
          </TabsContent>

          <TabsContent value="ended" className="space-y-4">
            {renderSaleGrid(filterSales("ended"))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyLaunchState() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">No sales yet</p>
        <p className="text-sm text-muted-foreground">
          Check back soon for upcoming token sales
        </p>
      </CardContent>
    </Card>
  );
}
