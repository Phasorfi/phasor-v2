import { useReadContract, useReadContracts } from "wagmi";
import { Address, zeroAddress } from "viem";
import { CONTRACTS, FACTORY_ABI, PAIR_ABI } from "@/config";
import { Token, Pool } from "@/types";
import { sortTokens } from "@/lib/utils";

interface UsePairResult {
  pairAddress: Address | null;
  reserves: { reserve0: bigint; reserve1: bigint } | null;
  totalSupply: bigint;
  token0: Address | null;
  token1: Address | null;
  isLoading: boolean;
  exists: boolean;
  refetch: () => void;
}

export function usePair(
  tokenA: Token | null,
  tokenB: Token | null
): UsePairResult {
  // Get pair address from factory
  const {
    data: pairAddress,
    isLoading: isPairLoading,
    refetch: refetchPair,
  } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: "getPair",
    args: tokenA && tokenB ? [tokenA.address, tokenB.address] : undefined,
    query: {
      enabled: !!tokenA && !!tokenB,
    },
  });

  const isValidPair =
    pairAddress && pairAddress !== zeroAddress;

  // Get pair data
  const { data: pairData, isLoading: isPairDataLoading } = useReadContracts({
    contracts: [
      {
        address: pairAddress as Address,
        abi: PAIR_ABI,
        functionName: "getReserves",
      },
      {
        address: pairAddress as Address,
        abi: PAIR_ABI,
        functionName: "totalSupply",
      },
      {
        address: pairAddress as Address,
        abi: PAIR_ABI,
        functionName: "token0",
      },
      {
        address: pairAddress as Address,
        abi: PAIR_ABI,
        functionName: "token1",
      },
    ],
    query: {
      enabled: !!isValidPair,
    },
  });

  const reserves = pairData?.[0]?.result as
    | [bigint, bigint, number]
    | undefined;
  const totalSupply = pairData?.[1]?.result as bigint | undefined;
  const token0 = pairData?.[2]?.result as Address | undefined;
  const token1 = pairData?.[3]?.result as Address | undefined;

  return {
    pairAddress: isValidPair ? (pairAddress as Address) : null,
    reserves: reserves
      ? { reserve0: reserves[0], reserve1: reserves[1] }
      : null,
    totalSupply: totalSupply ?? BigInt(0),
    token0: token0 ?? null,
    token1: token1 ?? null,
    isLoading: isPairLoading || isPairDataLoading,
    exists: !!isValidPair,
    refetch: refetchPair,
  };
}

// Hook to get reserves in the correct order based on input tokens
export function useOrderedReserves(
  tokenA: Token | null,
  tokenB: Token | null
) {
  const { reserves, token0, isLoading, exists, pairAddress, totalSupply, refetch } = usePair(
    tokenA,
    tokenB
  );

  if (!tokenA || !tokenB || !reserves || !token0) {
    return {
      reserveA: BigInt(0),
      reserveB: BigInt(0),
      isLoading,
      exists,
      pairAddress,
      totalSupply,
      refetch,
    };
  }

  // Determine which reserve corresponds to which token
  const isToken0A = tokenA.address.toLowerCase() === token0.toLowerCase();

  return {
    reserveA: isToken0A ? reserves.reserve0 : reserves.reserve1,
    reserveB: isToken0A ? reserves.reserve1 : reserves.reserve0,
    isLoading,
    exists,
    pairAddress,
    totalSupply,
    refetch,
  };
}
