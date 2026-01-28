import { useQuery } from "@apollo/client/react";
import { useAccount, useReadContract } from "wagmi";
import { useMemo } from "react";
import { Address, erc20Abi, parseUnits } from "viem";
import { GET_USER_POSITIONS } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { UserPosition, Pool, Token } from "@/types";

interface SubgraphToken {
  id: string;
  symbol: string;
  decimals: string;
}

interface SubgraphPair {
  id: string;
  token0: SubgraphToken;
  token1: SubgraphToken;
}

interface SubgraphMint {
  id: string;
  timestamp: string;
  pair: SubgraphPair;
  to: string;
  liquidity: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
}

interface SubgraphBurn {
  id: string;
  timestamp: string;
  pair: SubgraphPair;
  sender: string;
  liquidity: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
}

interface GetUserPositionsData {
  mints: SubgraphMint[];
  burns: SubgraphBurn[];
}

interface UseUserPositionsFromSubgraphResult {
  positions: UserPosition[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useUserPositionsFromSubgraph(): UseUserPositionsFromSubgraphResult {
  const { address: account } = useAccount();

  const { data, loading, error, refetch } = useQuery<GetUserPositionsData>(
    GET_USER_POSITIONS,
    {
      client: apolloClient,
      variables: {
        user: account?.toLowerCase() || "",
      },
      skip: !account,
      // Remove pollInterval to prevent too many requests
    }
  );

  // Group mints and burns by pair to calculate net positions
  const positionsByPair = useMemo(() => {
    if (!data?.mints && !data?.burns) return new Map();

    const pairMap = new Map<
      string,
      {
        pair: SubgraphPair;
        totalMinted: bigint;
        totalBurned: bigint;
        totalDepositedUSD: number;
        totalWithdrawnUSD: number;
      }
    >();

    // Process mints (deposits)
    data?.mints?.forEach((mint) => {
      const pairId = mint.pair.id.toLowerCase();
      const existing: {
        pair: SubgraphPair;
        totalMinted: bigint;
        totalBurned: bigint;
        totalDepositedUSD: number;
        totalWithdrawnUSD: number;
      } = pairMap.get(pairId) || {
        pair: mint.pair,
        totalMinted: BigInt(0),
        totalBurned: BigInt(0),
        totalDepositedUSD: 0,
        totalWithdrawnUSD: 0,
      };

      const newTotalMinted: bigint = existing.totalMinted + parseUnits(mint.liquidity, 18);

      pairMap.set(pairId, {
        pair: existing.pair,
        totalMinted: newTotalMinted, // LP tokens are 18 decimals
        totalBurned: existing.totalBurned,
        totalDepositedUSD: existing.totalDepositedUSD + parseFloat(mint.amountUSD || "0"),
        totalWithdrawnUSD: existing.totalWithdrawnUSD,
      });
    });

    // Process burns (withdrawals)
    data?.burns?.forEach((burn) => {
      const pairId = burn.pair.id.toLowerCase();
      const existing: {
        pair: SubgraphPair;
        totalMinted: bigint;
        totalBurned: bigint;
        totalDepositedUSD: number;
        totalWithdrawnUSD: number;
      } = pairMap.get(pairId) || {
        pair: burn.pair,
        totalMinted: BigInt(0),
        totalBurned: BigInt(0),
        totalDepositedUSD: 0,
        totalWithdrawnUSD: 0,
      };

      const newTotalBurned: bigint = existing.totalBurned + parseUnits(burn.liquidity, 18);

      pairMap.set(pairId, {
        pair: existing.pair,
        totalMinted: existing.totalMinted,
        totalBurned: newTotalBurned, // LP tokens are 18 decimals
        totalDepositedUSD: existing.totalDepositedUSD,
        totalWithdrawnUSD: existing.totalWithdrawnUSD + parseFloat(burn.amountUSD || "0"),
      });
    });

    return pairMap;
  }, [data]);

  // Convert to UserPosition array with current balances
  const positions = useMemo(() => {
    if (!account || positionsByPair.size === 0) return [];

    return Array.from(positionsByPair.entries())
      .map(([pairId, positionData]: [string, {
        pair: SubgraphPair;
        totalMinted: bigint;
        totalBurned: bigint;
        totalDepositedUSD: number;
        totalWithdrawnUSD: number;
      }]): UserPosition | null => {
        const netLiquidity: bigint = positionData.totalMinted - positionData.totalBurned;

        // Skip positions with no remaining liquidity
        if (netLiquidity <= BigInt(0)) return null;

        const token0: Token = {
          address: positionData.pair.token0.id as Address,
          symbol: positionData.pair.token0.symbol,
          name: positionData.pair.token0.symbol,
          decimals: parseInt(positionData.pair.token0.decimals),
        };

        const token1: Token = {
          address: positionData.pair.token1.id as Address,
          symbol: positionData.pair.token1.symbol,
          name: positionData.pair.token1.symbol,
          decimals: parseInt(positionData.pair.token1.decimals),
        };

        const pool: Pool = {
          address: pairId as Address,
          token0,
          token1,
          reserve0: BigInt(0), // Will be fetched from contract if needed
          reserve1: BigInt(0),
          totalSupply: BigInt(0),
          fee: 30,
          tvlUSD: 0,
          volume24hUSD: 0,
          apr: 0,
        };

        // Calculate share percentage (will be accurate once we fetch totalSupply from contract)
        const share = 0; // Placeholder - will be calculated with real-time data

        return {
          pool,
          liquidity: netLiquidity,
          share,
          token0Amount: BigInt(0), // Will be calculated from reserves
          token1Amount: BigInt(0),
        };
      })
      .filter((p): p is UserPosition => p !== null);
  }, [account, positionsByPair]);

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
          { name: "reserve0", type: "uint112" },
          { name: "reserve1", type: "uint112" },
          { name: "blockTimestampLast", type: "uint32" },
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

    const [reserve0, reserve1] = reserves as [bigint, bigint, number];
    const supply = totalSupply as bigint;

    // Calculate user's share
    const share = supply > BigInt(0)
      ? (Number(position.liquidity) / Number(supply)) * 100
      : 0;

    // Calculate token amounts based on share
    const token0Amount = (position.liquidity * reserve0) / supply;
    const token1Amount = (position.liquidity * reserve1) / supply;

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
