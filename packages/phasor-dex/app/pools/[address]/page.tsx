"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PoolDetailHeader } from "@/components/pool/PoolDetailHeader";
import { PoolDetailStats } from "@/components/pool/PoolDetailStats";
import { PoolDetailChart } from "@/components/pool/PoolDetailChart";
import { PoolDetailTransactions } from "@/components/pool/PoolDetailTransactions";
import { usePoolDetail } from "@/hooks/usePoolDetail";
import { Skeleton } from "@/components/ui/skeleton";

interface PoolDetailPageProps {
  params: Promise<{ address: string }>;
}

export default function PoolDetailPage({ params }: PoolDetailPageProps) {
  const { address } = use(params);
  const router = useRouter();
  const { pool, isLoading, error } = usePoolDetail(address);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <Skeleton className="h-24 w-full mb-6" />
          <Skeleton className="h-96 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div className="container py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Pool not found</h2>
            <p className="text-muted-foreground mb-6">
              The pool you're looking for doesn't exist or hasn't been indexed yet.
            </p>
            <Button onClick={() => router.push("/pools")}>
              Back to Pools
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push("/pools")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pools
        </Button>

        {/* Pool Header */}
        <PoolDetailHeader pool={pool} />

        {/* Stats Overview */}
        <PoolDetailStats pool={pool} />

        {/* Chart */}
        <PoolDetailChart pool={pool} />

        {/* Recent Transactions */}
        <PoolDetailTransactions poolAddress={address} />
      </div>
    </div>
  );
}
