"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { GET_USER_TRANSACTIONS, GET_POOLS_BY_ADDRESSES } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { PortfolioTransaction, Token } from "@/types";
import { Address } from "viem";

export interface UseUserTransactionsResult {
  transactions: PortfolioTransaction[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

interface UserPoolStats {
  id: string;
  poolAddress: string;
  chainId: number;
  numberOfSwaps: string;
  totalSwapVolumeUSD: string;
  totalLiquidityAddedUSD: string;
  totalLiquidityRemovedUSD: string;
  firstActivityTimestamp: string;
  lastActivityTimestamp: string;
}

interface UserTransactionsData {
  UserStatsPerPool?: UserPoolStats[];
}

interface PoolData {
  poolAddress: string;
  name: string;
  token0_address: string;
  token1_address: string;
}

export function useUserTransactions(): UseUserTransactionsResult {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();

  const { data, loading, error } = useQuery<UserTransactionsData>(GET_USER_TRANSACTIONS, {
    client: apolloClient,
    variables: {
      user: userAddress?.toLowerCase() || "",
      chainId,
    },
    skip: !userAddress,
  });

  // Collect pool addresses to get token info
  const poolAddresses = useMemo(() => {
    if (!data?.UserStatsPerPool) return [];
    return data.UserStatsPerPool.map(s => s.poolAddress.toLowerCase());
  }, [data]);

  const { data: poolsData } = useQuery(GET_POOLS_BY_ADDRESSES, {
    client: apolloClient,
    variables: {
      poolAddresses,
      chainId,
    },
    skip: poolAddresses.length === 0,
  });

  // Build pool lookup map
  const poolMap = useMemo(() => {
    const map = new Map<string, PoolData>();
    if (poolsData?.LiquidityPoolAggregator) {
      poolsData.LiquidityPoolAggregator.forEach((pool: PoolData) => {
        map.set(pool.poolAddress.toLowerCase(), pool);
      });
    }
    return map;
  }, [poolsData]);

  const transactions = useMemo(() => {
    if (!data?.UserStatsPerPool) return [];

    const allTransactions: PortfolioTransaction[] = [];

    data.UserStatsPerPool.forEach((stats) => {
      const pool = poolMap.get(stats.poolAddress.toLowerCase());
      const poolName = pool?.name || "";
      const nameTokens = poolName.replace(/^[vs]AMM-/, "").split("/");

      const token0: Token = {
        address: (pool?.token0_address || stats.poolAddress) as Address,
        symbol: nameTokens[0] || "TKN0",
        name: nameTokens[0] || "Token 0",
        decimals: 18,
      };

      const token1: Token = {
        address: (pool?.token1_address || stats.poolAddress) as Address,
        symbol: nameTokens[1] || "TKN1",
        name: nameTokens[1] || "Token 1",
        decimals: 18,
      };

      const lastTs = stats.lastActivityTimestamp
        ? Math.floor(new Date(stats.lastActivityTimestamp).getTime() / 1000)
        : 0;

      // Create a swap summary entry if the user has swapped in this pool
      if (parseInt(stats.numberOfSwaps || "0") > 0) {
        allTransactions.push({
          id: `${stats.id}-swap`,
          type: "swap",
          timestamp: lastTs,
          token0,
          token1,
          amount0: `${stats.numberOfSwaps} swaps`,
          amount1: "",
          amountUSD: parseFloat(stats.totalSwapVolumeUSD || "0"),
          hash: stats.poolAddress,
        });
      }

      // Create a mint summary entry if the user has added liquidity
      const addedUSD = parseFloat(stats.totalLiquidityAddedUSD || "0");
      if (addedUSD > 0) {
        allTransactions.push({
          id: `${stats.id}-mint`,
          type: "mint",
          timestamp: lastTs,
          token0,
          token1,
          amount0: "",
          amount1: "",
          amountUSD: addedUSD,
          hash: stats.poolAddress,
        });
      }

      // Create a burn summary entry if the user has removed liquidity
      const removedUSD = parseFloat(stats.totalLiquidityRemovedUSD || "0");
      if (removedUSD > 0) {
        allTransactions.push({
          id: `${stats.id}-burn`,
          type: "burn",
          timestamp: lastTs,
          token0,
          token1,
          amount0: "",
          amount1: "",
          amountUSD: removedUSD,
          hash: stats.poolAddress,
        });
      }
    });

    // Sort by timestamp (newest first)
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }, [data, poolMap]);

  return {
    transactions,
    isLoading: loading,
    error: error || null,
    loadMore: () => {},
    hasMore: false,
  };
}
