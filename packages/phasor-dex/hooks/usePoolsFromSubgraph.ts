"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { Address, formatUnits } from "viem";
import { GET_POOLS, GET_TOKENS_BY_ADDRESSES } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { Pool, Token } from "@/types";
import { useChainId } from "wagmi";

// Velodrome LiquidityPoolAggregator schema
interface VelodromePool {
  id: string;
  chainId: number;
  poolAddress: string;
  name: string;
  token0_id: string;
  token1_id: string;
  token0_address: string;
  token1_address: string;
  isStable: boolean;
  isCL: boolean;
  reserve0: string; // BigInt as string
  reserve1: string; // BigInt as string
  totalLPTokenSupply: string;
  totalLiquidityUSD: string;
  totalVolumeUSD: string;
  totalFeesGeneratedUSD: string;
  numberOfSwaps: string;
  token0Price: string;
  token1Price: string;
  baseFee: string;
  currentFee: string;
  lastUpdatedTimestamp: string;
}

interface VelodromeToken {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: string;
  chainId: number;
  pricePerUSDNew: string;
}

interface GetPoolsData {
  LiquidityPoolAggregator: VelodromePool[];
}

interface GetTokensData {
  Token: VelodromeToken[];
}

interface UsePoolsFromSubgraphResult {
  pools: Pool[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function usePoolsFromSubgraph(
  limit: number = 100
): UsePoolsFromSubgraphResult {
  const chainId = useChainId();

  // Fetch pools from Velodrome indexer
  const { data: poolsData, loading: poolsLoading, error: poolsError, refetch } = useQuery<GetPoolsData>(GET_POOLS, {
    client: apolloClient,
    variables: {
      chainId,
      limit,
      offset: 0,
    },
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });

  // Collect unique token addresses to fetch
  const tokenAddresses = useMemo(() => {
    if (!poolsData?.LiquidityPoolAggregator) return [];
    const addresses = new Set<string>();
    poolsData.LiquidityPoolAggregator.forEach((pool) => {
      addresses.add(pool.token0_address.toLowerCase());
      addresses.add(pool.token1_address.toLowerCase());
    });
    return Array.from(addresses);
  }, [poolsData]);

  // Fetch token metadata
  const { data: tokensData, loading: tokensLoading } = useQuery<GetTokensData>(GET_TOKENS_BY_ADDRESSES, {
    client: apolloClient,
    variables: {
      addresses: tokenAddresses,
      chainId,
    },
    skip: tokenAddresses.length === 0,
    errorPolicy: "all",
    fetchPolicy: "cache-first",
  });

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[usePoolsFromSubgraph] Query state:', {
      poolsLoading,
      tokensLoading,
      error: poolsError?.message,
      poolsCount: poolsData?.LiquidityPoolAggregator?.length || 0,
      tokensCount: tokensData?.Token?.length || 0,
    });
  }

  // Build token lookup map
  const tokenMap = useMemo(() => {
    const map = new Map<string, VelodromeToken>();
    if (tokensData?.Token) {
      tokensData.Token.forEach((token) => {
        map.set(token.address.toLowerCase(), token);
      });
    }
    return map;
  }, [tokensData]);

  // Transform pools to frontend format
  const pools = useMemo(() => {
    if (!poolsData?.LiquidityPoolAggregator) return [];

    return poolsData.LiquidityPoolAggregator.map((pool): Pool => {
      const token0Data = tokenMap.get(pool.token0_address.toLowerCase());
      const token1Data = tokenMap.get(pool.token1_address.toLowerCase());

      // Fallback token objects if not found
      const token0: Token = {
        address: pool.token0_address as Address,
        symbol: token0Data?.symbol || pool.name.split('/')[0] || 'TKN0',
        name: token0Data?.name || 'Unknown Token 0',
        decimals: token0Data ? parseInt(token0Data.decimals) : 18,
      };

      const token1: Token = {
        address: pool.token1_address as Address,
        symbol: token1Data?.symbol || pool.name.split('/')[1] || 'TKN1',
        name: token1Data?.name || 'Unknown Token 1',
        decimals: token1Data ? parseInt(token1Data.decimals) : 18,
      };

      // Parse Velodrome BigInt values (stored as raw wei)
      // The Velodrome schema stores reserves as raw BigInt strings
      const reserve0 = BigInt(pool.reserve0 || '0');
      const reserve1 = BigInt(pool.reserve1 || '0');
      const totalSupply = BigInt(pool.totalLPTokenSupply || '0');

      // Parse USD values (stored as BigInt with 18 decimals in Velodrome schema)
      const totalLiquidityUSD = parseFloat(formatUnits(BigInt(pool.totalLiquidityUSD || '0'), 18));
      const totalVolumeUSD = parseFloat(formatUnits(BigInt(pool.totalVolumeUSD || '0'), 18));
      const totalFeesUSD = parseFloat(formatUnits(BigInt(pool.totalFeesGeneratedUSD || '0'), 18));

      // Calculate APR from fees and liquidity
      // APR = (annual fees / TVL) * 100
      // Assuming fees are cumulative, estimate daily from total/numberOfSwaps
      const numberOfSwaps = parseInt(pool.numberOfSwaps || '0');
      const avgFeePerSwap = numberOfSwaps > 0 ? totalFeesUSD / numberOfSwaps : 0;
      const estimatedDailySwaps = numberOfSwaps > 0 ? 50 : 0; // Rough estimate
      const estimatedDailyFees = avgFeePerSwap * estimatedDailySwaps;
      const apr = totalLiquidityUSD > 0
        ? (estimatedDailyFees * 365 / totalLiquidityUSD) * 100
        : 0;

      // Parse fee (stored as basis points * 100 in Velodrome, e.g., 30 = 0.3%)
      const fee = parseInt(pool.currentFee || pool.baseFee || '30');

      return {
        address: pool.poolAddress as Address,
        token0,
        token1,
        reserve0,
        reserve1,
        totalSupply,
        fee: Math.min(fee, 100), // Cap at 1% to handle any scaling issues
        tvlUSD: totalLiquidityUSD,
        volume24hUSD: totalVolumeUSD / 365, // Rough daily estimate from total
        apr: Math.min(apr, 1000), // Cap at 1000% to handle extreme cases
        isStable: pool.isStable,
      };
    });
  }, [poolsData, tokenMap]);

  return {
    pools,
    isLoading: poolsLoading || tokensLoading,
    error: poolsError || null,
    refetch,
  };
}
