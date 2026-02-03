"use client";

import React, { useState, useEffect } from "react";
import { Rocket, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAccount } from "wagmi";
import { useLaunchpad } from "@/hooks/useLaunchpad";
import { LaunchCard } from "@/components/launchpad/LaunchCard";

export default function LaunchpadPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState("");
  const { isConnected } = useAccount();
  const { launchAddresses, launchCount, isLoading } = useLaunchpad();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Launchpad</h1>
            <p className="text-muted-foreground mt-1">
              Participate in fair launch token sales
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Rocket className="h-5 w-5" />
            <span>{launchCount} launches</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All Launches</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="ended">Ended</TabsTrigger>
            </TabsList>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search launches..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* All Launches */}
          <TabsContent value="all" className="space-y-4">
            {!isMounted || isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
              </div>
            ) : launchAddresses.length === 0 ? (
              <EmptyLaunchState />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {launchAddresses.map((address) => (
                  <LaunchCard key={address} launchAddress={address} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active */}
          <TabsContent value="active" className="space-y-4">
            {!isMounted || isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {launchAddresses.map((address) => (
                  <LaunchCard key={address} launchAddress={address} filterState="active" />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upcoming */}
          <TabsContent value="upcoming" className="space-y-4">
            {!isMounted || isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {launchAddresses.map((address) => (
                  <LaunchCard key={address} launchAddress={address} filterState="pending" />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Ended */}
          <TabsContent value="ended" className="space-y-4">
            {!isMounted || isLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-64" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {launchAddresses.map((address) => (
                  <LaunchCard key={address} launchAddress={address} filterState="ended" />
                ))}
              </div>
            )}
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
        <p className="text-muted-foreground mb-2">No launches yet</p>
        <p className="text-sm text-muted-foreground">
          Check back soon for upcoming token launches
        </p>
      </CardContent>
    </Card>
  );
}
