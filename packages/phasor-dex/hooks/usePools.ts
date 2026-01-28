import { useReadContract, useReadContracts } from "wagmi";
import { Address } from "viem";
import { CONTRACTS, FACTORY_ABI, PAIR_ABI } from "@/config";
import { Pool, Token } from "@/types";
import { DEFAULT_TOKENS } from "@/config/chains";
import { useMemo } from "react";

export function usePools() {
  // Get the total number of pairs from the factory
  const { data: pairsLength, isLoading: isPairsLengthLoading } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: "allPairsLength",
  });

  const totalPairs = Number(pairsLength ?? 0);

  // Get all pair addresses
  const pairAddressContracts = useMemo(() => {
    if (totalPairs === 0) return [];
    return Array.from({ length: totalPairs }, (_, i) => ({
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: "allPairs" as const,
      args: [BigInt(i)],
    }));
  }, [totalPairs]);

  const { data: pairAddresses, isLoading: isPairAddressesLoading } = useReadContracts({
    contracts: pairAddressContracts,
    query: {
      enabled: totalPairs > 0,
    },
  });

  // Get data for each pair
  const pairDataContracts = useMemo(() => {
    if (!pairAddresses || pairAddresses.length === 0) return [];

    return pairAddresses.flatMap((pair) => {
      const pairAddress = pair.result as Address | undefined;
      if (!pairAddress) return [];

      return [
        {
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: "token0" as const,
        },
        {
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: "token1" as const,
        },
        {
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: "getReserves" as const,
        },
        {
          address: pairAddress,
          abi: PAIR_ABI,
          functionName: "totalSupply" as const,
        },
      ];
    });
  }, [pairAddresses]);

  const { data: pairData, isLoading: isPairDataLoading, refetch: refetchPairData } = useReadContracts({
    contracts: pairDataContracts,
    query: {
      enabled: pairDataContracts.length > 0,
      // Reasonable defaults for production - data updates on block changes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    },
  });

  // Process the data into Pool objects
  const pools: Pool[] = useMemo(() => {
    if (!pairAddresses || !pairData || pairData.length === 0) {
      return [];
    }

    const pools: Pool[] = [];
    const itemsPerPair = 4; // token0, token1, reserves, totalSupply

    for (let i = 0; i < pairAddresses.length; i++) {
      const pairAddress = pairAddresses[i].result as Address | undefined;
      if (!pairAddress) continue;

      const baseIndex = i * itemsPerPair;
      const token0Address = pairData[baseIndex]?.result as Address | undefined;
      const token1Address = pairData[baseIndex + 1]?.result as Address | undefined;
      const reserves = pairData[baseIndex + 2]?.result as [bigint, bigint, number] | undefined;
      const totalSupply = pairData[baseIndex + 3]?.result as bigint | undefined;

      if (!token0Address || !token1Address || !reserves || !totalSupply) continue;

      // Find token metadata from DEFAULT_TOKENS
      const token0 = DEFAULT_TOKENS.find(
        (t) => t.address.toLowerCase() === token0Address.toLowerCase()
      );
      const token1 = DEFAULT_TOKENS.find(
        (t) => t.address.toLowerCase() === token1Address.toLowerCase()
      );

      // Create fallback tokens if not found in DEFAULT_TOKENS
      const token0Data: Token = token0 ?? {
        address: token0Address,
        symbol: `Token${token0Address.slice(0, 6)}`,
        name: `Unknown Token`,
        decimals: 18,
      };

      const token1Data: Token = token1 ?? {
        address: token1Address,
        symbol: `Token${token1Address.slice(0, 6)}`,
        name: `Unknown Token`,
        decimals: 18,
      };

      pools.push({
        address: pairAddress,
        token0: token0Data,
        token1: token1Data,
        reserve0: reserves[0],
        reserve1: reserves[1],
        totalSupply,
        fee: 30, // 0.3% fee (Uniswap V2 standard)
      });
    }

    return pools;
  }, [pairAddresses, pairData]);

  return {
    pools,
    isLoading: isPairsLengthLoading || isPairAddressesLoading || isPairDataLoading,
    totalPairs,
    refetch: refetchPairData,
  };
}
