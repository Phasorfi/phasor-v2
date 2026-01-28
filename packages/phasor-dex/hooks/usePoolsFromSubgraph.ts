import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { Address, parseUnits } from "viem";
import { GET_POOLS } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { Pool, Token } from "@/types";

interface SubgraphToken {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
  derivedETH: string;
}

interface SubgraphPair {
  id: string;
  token0: SubgraphToken;
  token1: SubgraphToken;
  reserve0: string;
  reserve1: string;
  reserveUSD: string;
  totalSupply: string;
  volumeUSD: string;
  txCount: string;
}

interface GetPoolsData {
  pairs: SubgraphPair[];
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
  const { data, loading, error, refetch } = useQuery<GetPoolsData>(GET_POOLS, {
    client: apolloClient,
    variables: {
      first: limit,
      skip: 0,
      orderBy: "reserveUSD",
      orderDirection: "desc",
    },
    // Remove pollInterval to prevent too many requests
    errorPolicy: "all", // Return partial data on error
    fetchPolicy: "cache-first", // Use cache to avoid errors on initial load
  });

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[usePoolsFromSubgraph] Query state:', {
      loading,
      error: error?.message,
      dataExists: !!data,
      pairsCount: data?.pairs?.length || 0,
      pairs: data?.pairs,
    });
  }

  const pools = useMemo(() => {
    if (!data?.pairs) return [];

    return data.pairs.map((pair): Pool => {
      const token0: Token = {
        address: pair.token0.id as Address,
        symbol: pair.token0.symbol,
        name: pair.token0.name,
        decimals: parseInt(pair.token0.decimals),
      };

      const token1: Token = {
        address: pair.token1.id as Address,
        symbol: pair.token1.symbol,
        name: pair.token1.name,
        decimals: parseInt(pair.token1.decimals),
      };

      const reserveUSD = parseFloat(pair.reserveUSD);
      const volumeUSD = parseFloat(pair.volumeUSD);

      // Calculate APR from 24h volume
      // APR = (24h volume * 0.3% fee * 365) / TVL * 100
      const dailyVolume = volumeUSD / 365; // Approximate daily volume from total
      const poolFee = 0.003; // 0.3%
      const apr = reserveUSD > 0
        ? ((dailyVolume * poolFee * 365) / reserveUSD) * 100
        : 0;

      return {
        address: pair.id as Address,
        token0,
        token1,
        reserve0: parseUnits(pair.reserve0, token0.decimals),
        reserve1: parseUnits(pair.reserve1, token1.decimals),
        totalSupply: parseUnits(pair.totalSupply, 18), // LP tokens are always 18 decimals
        fee: 30, // 0.3% in basis points
        tvlUSD: reserveUSD,
        volume24hUSD: dailyVolume,
        apr,
      };
    });
  }, [data]);

  return {
    pools,
    isLoading: loading,
    error: error || null,
    refetch,
  };
}
