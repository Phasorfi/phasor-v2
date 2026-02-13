import { useMemo } from "react";
import { Address } from "viem";
import { useReadContracts, useChainId } from "wagmi";
import { useQuery } from "@apollo/client/react";
import { Pool, Token } from "@/types";
import { PAIR_ABI } from "@/config";
import { DEFAULT_TOKENS } from "@/config/chains";
import { GET_POOL_BY_ADDRESS } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";

interface UsePoolDetailResult {
  pool: Pool | null;
  isLoading: boolean;
  error: Error | null;
}

interface SubgraphPoolData {
  LiquidityPoolAggregator: Array<{
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
    totalVolumeUSD: string;
    numberOfSwaps: string;
    token0Price: string;
    token1Price: string;
    baseFee: string;
    currentFee: string;
  }> | null;
}

/**
 * Hybrid hook to fetch detailed data for a single pool
 * Combines direct contract calls with subgraph enrichment
 */
export function usePoolDetail(poolAddress: string): UsePoolDetailResult {
  const address = poolAddress as Address;
  const chainId = useChainId();

  // Fetch core pool data from contracts
  const { data: contractData, isLoading: isContractLoading } = useReadContracts({
    contracts: [
      {
        address,
        abi: PAIR_ABI,
        functionName: "token0",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "token1",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "getReserves",
      },
      {
        address,
        abi: PAIR_ABI,
        functionName: "totalSupply",
      },
    ],
  });

  // Fetch enrichment data from subgraph using address + chainId lookup
  const { data: subgraphData, loading: isSubgraphLoading, error: subgraphError } = useQuery<SubgraphPoolData>(GET_POOL_BY_ADDRESS, {
    client: apolloClient,
    variables: {
      poolAddress: poolAddress.toLowerCase(),
      chainId,
    },
    skip: !poolAddress,
  });

  // Combine contract and subgraph data
  const pool = useMemo((): Pool | null => {
    if (!contractData) return null;

    const [token0Result, token1Result, reservesResult, totalSupplyResult] = contractData;

    if (
      token0Result.status !== "success" ||
      token1Result.status !== "success" ||
      reservesResult.status !== "success" ||
      totalSupplyResult.status !== "success"
    ) {
      return null;
    }

    const token0Address = token0Result.result as Address;
    const token1Address = token1Result.result as Address;
    // Velodrome uses uint256 for all reserves fields (including timestamp)
    const reserves = reservesResult.result as readonly [bigint, bigint, bigint];
    const totalSupply = totalSupplyResult.result as bigint;

    // Find token metadata from DEFAULT_TOKENS or subgraph
    const subgraphPool = subgraphData?.LiquidityPoolAggregator?.[0] ?? null;

    // Parse pool name for token symbols (format: "vAMM-TOKEN0/TOKEN1" or "sAMM-TOKEN0/TOKEN1")
    const poolName = subgraphPool?.name || "";
    const nameTokens = poolName.replace(/^[vs]AMM-/, "").split("/");

    // Prefer token list over subgraph for metadata
    const token0FromList = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token0Address.toLowerCase());
    const token1FromList = DEFAULT_TOKENS.find(t => t.address.toLowerCase() === token1Address.toLowerCase());

    const token0: Token = {
      address: token0Address,
      symbol: token0FromList?.symbol || nameTokens[0] || `Token${token0Address.slice(0, 6)}`,
      name: token0FromList?.name || nameTokens[0] || "Unknown Token",
      decimals: token0FromList?.decimals || 18,
      logoURI: token0FromList?.logoURI,
    };

    const token1: Token = {
      address: token1Address,
      symbol: token1FromList?.symbol || nameTokens[1] || `Token${token1Address.slice(0, 6)}`,
      name: token1FromList?.name || nameTokens[1] || "Unknown Token",
      decimals: token1FromList?.decimals || 18,
      logoURI: token1FromList?.logoURI,
    };

    // Calculate enrichment data from subgraph if available
    const tvlUSD = subgraphPool?.totalLiquidityUSD ? parseFloat(subgraphPool.totalLiquidityUSD) : undefined;
    const volumeUSD = subgraphPool?.totalVolumeUSD ? parseFloat(subgraphPool.totalVolumeUSD) : undefined;

    // Calculate APR from 24h volume estimate
    const dailyVolume = volumeUSD ? volumeUSD / 365 : undefined;
    const poolFee = subgraphPool?.currentFee ? parseInt(subgraphPool.currentFee) / 10000 : 0.003;
    const apr = tvlUSD && dailyVolume && tvlUSD > 0
      ? ((dailyVolume * poolFee * 365) / tvlUSD) * 100
      : undefined;

    return {
      address,
      token0,
      token1,
      reserve0: reserves[0],
      reserve1: reserves[1],
      totalSupply,
      fee: subgraphPool?.currentFee ? parseInt(subgraphPool.currentFee) : 30,
      tvlUSD,
      volume24hUSD: dailyVolume,
      apr,
      isStable: subgraphPool?.isStable,
    };
  }, [contractData, subgraphData, poolAddress]);

  return {
    pool,
    isLoading: isContractLoading || isSubgraphLoading,
    error: subgraphError || null,
  };
}
