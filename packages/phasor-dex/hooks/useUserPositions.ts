import { useReadContracts, useAccount } from "wagmi";
import { Address, erc20Abi } from "viem";
import { useMemo } from "react";
import { Pool, UserPosition } from "@/types";
import { usePools } from "./usePools";

export function useUserPositions() {
  const { address } = useAccount();
  const { pools, isLoading: isPoolsLoading } = usePools();

  // Get LP token balances for all pools
  const balanceContracts = useMemo(() => {
    if (!address || pools.length === 0) return [];

    return pools.map((pool) => ({
      address: pool.address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: [address],
    }));
  }, [address, pools]);

  const { data: balances, isLoading: isBalancesLoading, refetch: refetchBalances } = useReadContracts({
    contracts: balanceContracts,
    query: {
      enabled: !!address && balanceContracts.length > 0,
      // Reasonable defaults for production - data updates on block changes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  // Process user positions
  const positions: UserPosition[] = useMemo(() => {
    if (!address || !balances || !pools || pools.length === 0) return [];

    const userPositions: UserPosition[] = [];

    pools.forEach((pool, index) => {
      const balance = balances[index]?.result as bigint | undefined;

      // Only include pools where user has LP tokens
      if (!balance || balance === 0n) return;

      // Calculate share percentage
      const share = pool.totalSupply > 0n
        ? (Number(balance) / Number(pool.totalSupply)) * 100
        : 0;

      // Calculate token amounts based on share
      const token0Amount = pool.totalSupply > 0n
        ? (balance * pool.reserve0) / pool.totalSupply
        : 0n;

      const token1Amount = pool.totalSupply > 0n
        ? (balance * pool.reserve1) / pool.totalSupply
        : 0n;

      userPositions.push({
        pool,
        liquidity: balance,
        share,
        token0Amount,
        token1Amount,
      });
    });

    // Sort by share percentage (highest first)
    return userPositions.sort((a, b) => b.share - a.share);
  }, [address, balances, pools]);

  return {
    positions,
    isLoading: isPoolsLoading || isBalancesLoading,
    hasPositions: positions.length > 0,
    refetch: refetchBalances,
  };
}
