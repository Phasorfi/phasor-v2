"use client";

import { useQuery } from "@apollo/client/react";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { useMemo } from "react";
import { Address, erc20Abi, formatUnits } from "viem";
import { GET_USER_POSITIONS, GET_POOLS_BY_ADDRESSES, GET_TOKENS_BY_ADDRESSES } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { UserPosition, Pool, Token } from "@/types";

// Velodrome UserStatsPerPool schema
interface VelodromeUserStats {
  id: string;
  userAddress: string;
  poolAddress: string;
  chainId: number;
  currentLiquidityUSD: string;
  lpBalance: string;
  totalLiquidityAddedUSD: string;
  totalLiquidityAddedToken0: string;
  totalLiquidityAddedToken1: string;
  totalLiquidityRemovedUSD: string;
  totalLiquidityRemovedToken0: string;
  totalLiquidityRemovedToken1: string;
  totalFeesContributedUSD: string;
  numberOfSwaps: string;
  totalSwapVolumeUSD: string;
  firstActivityTimestamp: string;
  lastActivityTimestamp: string;
}

interface VelodromePool {
  id: string;
  poolAddress: string;
  name: string;
  token0_address: string;
  token1_address: string;
  isStable: boolean;
  reserve0: string;
  reserve1: string;
  totalLPTokenSupply: string;
  totalLiquidityUSD: string;
}

interface VelodromeToken {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: string;
}

interface GetUserPositionsData {
  UserStatsPerPool: VelodromeUserStats[];
}

interface UseUserPositionsFromSubgraphResult {
  positions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserPositionsFromSubgraph(): UseUserPositionsFromSubgraphResult {
  const { address: account } = useAccount();
  const chainId = useChainId();

  // Fetch user stats from Velodrome indexer
  const { data, loading, error, refetch } = useQuery<GetUserPositionsData>(
    GET_USER_POSITIONS,
    {
      client: apolloClient,
      variables: {
        user: account?.toLowerCase() || "",
        chainId,
      },
      skip: !account,
      fetchPolicy: "cache-first",
    }
  );

  // Collect pool addresses to fetch pool details
  const poolAddresses = useMemo(() => {
    if (!data?.UserStatsPerPool) return [];
    return data.UserStatsPerPool.map(stats => stats.poolAddress.toLowerCase());
  }, [data]);

  // Fetch pool details for all user positions using batch query
  const { data: poolsData } = useQuery(
    GET_POOLS_BY_ADDRESSES,
    {
      client: apolloClient,
      variables: {
        poolAddresses,
        chainId,
      },
      skip: poolAddresses.length === 0,
      fetchPolicy: "cache-first",
    }
  );

  // Collect token addresses from pools
  const tokenAddresses = useMemo(() => {
    if (!poolsData?.LiquidityPoolAggregator) return [];
    const addresses = new Set<string>();
    poolsData.LiquidityPoolAggregator.forEach((pool: VelodromePool) => {
      addresses.add(pool.token0_address.toLowerCase());
      addresses.add(pool.token1_address.toLowerCase());
    });
    return Array.from(addresses);
  }, [poolsData]);

  // Fetch token metadata
  const { data: tokensData } = useQuery(
    GET_TOKENS_BY_ADDRESSES,
    {
      client: apolloClient,
      variables: {
        addresses: tokenAddresses,
        chainId,
      },
      skip: tokenAddresses.length === 0,
      fetchPolicy: "cache-first",
    }
  );

  // Build lookup maps
  const poolMap = useMemo(() => {
    const map = new Map<string, VelodromePool>();
    if (poolsData?.LiquidityPoolAggregator) {
      poolsData.LiquidityPoolAggregator.forEach((pool: VelodromePool) => {
        map.set(pool.poolAddress.toLowerCase(), pool);
      });
    }
    return map;
  }, [poolsData]);

  const tokenMap = useMemo(() => {
    const map = new Map<string, VelodromeToken>();
    if (tokensData?.Token) {
      tokensData.Token.forEach((token: VelodromeToken) => {
        map.set(token.address.toLowerCase(), token);
      });
    }
    return map;
  }, [tokensData]);

  // Convert to UserPosition array
  const positions = useMemo(() => {
    if (!account || !data?.UserStatsPerPool) return [];

    return data.UserStatsPerPool
      .filter(stats => BigInt(stats.lpBalance || '0') > BigInt(0))
      .map((stats): UserPosition | null => {
        const poolData = poolMap.get(stats.poolAddress.toLowerCase());
        if (!poolData) return null;

        const token0Data = tokenMap.get(poolData.token0_address.toLowerCase());
        const token1Data = tokenMap.get(poolData.token1_address.toLowerCase());

        const token0: Token = {
          address: poolData.token0_address as Address,
          symbol: token0Data?.symbol || poolData.name.split('/')[0] || 'TKN0',
          name: token0Data?.name || 'Unknown Token',
          decimals: token0Data ? parseInt(token0Data.decimals) : 18,
        };

        const token1: Token = {
          address: poolData.token1_address as Address,
          symbol: token1Data?.symbol || poolData.name.split('/')[1] || 'TKN1',
          name: token1Data?.name || 'Unknown Token',
          decimals: token1Data ? parseInt(token1Data.decimals) : 18,
        };

        const lpBalance = BigInt(stats.lpBalance || '0');
        const totalSupply = BigInt(poolData.totalLPTokenSupply || '0');
        const reserve0 = BigInt(poolData.reserve0 || '0');
        const reserve1 = BigInt(poolData.reserve1 || '0');

        // Calculate share and token amounts
        const share = totalSupply > BigInt(0)
          ? (Number(lpBalance) / Number(totalSupply)) * 100
          : 0;

        const token0Amount = totalSupply > BigInt(0)
          ? (lpBalance * reserve0) / totalSupply
          : BigInt(0);

        const token1Amount = totalSupply > BigInt(0)
          ? (lpBalance * reserve1) / totalSupply
          : BigInt(0);

        const pool: Pool = {
          address: stats.poolAddress as Address,
          token0,
          token1,
          reserve0,
          reserve1,
          totalSupply,
          fee: 30,
          tvlUSD: parseFloat(formatUnits(BigInt(poolData.totalLiquidityUSD || '0'), 18)),
          volume24hUSD: 0,
          apr: 0,
          isStable: poolData.isStable,
        };

        return {
          pool,
          liquidity: lpBalance,
          share,
          token0Amount,
          token1Amount,
        };
      })
      .filter((p): p is UserPosition => p !== null);
  }, [account, data, poolMap, tokenMap]);

  return {
    positions,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}

// Hook to enrich a position with real-time data from contracts
export function useEnrichedPosition(position: UserPosition | null) {
  const { data: totalSupply } = useReadContract({
    address: position?.pool.address,
    abi: erc20Abi,
    functionName: "totalSupply",
    query: {
      enabled: !!position,
    },
  });

  const { data: reserves } = useReadContract({
    address: position?.pool.address,
    abi: [
      {
        inputs: [],
        name: "getReserves",
        outputs: [
          { name: "reserve0", type: "uint256" },
          { name: "reserve1", type: "uint256" },
          { name: "blockTimestampLast", type: "uint256" },
        ],
        stateMutability: "view",
        type: "function",
      },
    ] as const,
    functionName: "getReserves",
    query: {
      enabled: !!position,
    },
  });

  return useMemo(() => {
    if (!position || !totalSupply || !reserves) return position;

    const [reserve0, reserve1] = reserves as [bigint, bigint, bigint];
    const supply = totalSupply as bigint;

    // Calculate user's share
    const share = supply > BigInt(0)
      ? (Number(position.liquidity) / Number(supply)) * 100
      : 0;

    // Calculate token amounts based on share
    const token0Amount = supply > BigInt(0)
      ? (position.liquidity * reserve0) / supply
      : BigInt(0);
    const token1Amount = supply > BigInt(0)
      ? (position.liquidity * reserve1) / supply
      : BigInt(0);

    return {
      ...position,
      pool: {
        ...position.pool,
        reserve0,
        reserve1,
        totalSupply: supply,
      },
      share,
      token0Amount,
      token1Amount,
    };
  }, [position, totalSupply, reserves]);
}
