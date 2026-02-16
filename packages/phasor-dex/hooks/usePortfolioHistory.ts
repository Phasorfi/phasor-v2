"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { Address } from "viem";
import { GET_MULTI_TOKEN_PRICE_HISTORY } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";
import { useUserPositions } from "./useUserPositions";
import { useTokenBalances } from "./useTokenBalance";
import { PortfolioHistoryPoint, Token } from "@/types";

export type HistoryPeriod = "1D" | "1W" | "1M" | "ALL";

export interface UsePortfolioHistoryResult {
  data: PortfolioHistoryPoint[];
  isLoading: boolean;
  error: Error | null;
}

interface TokenPriceSnapshot {
  id: string;
  address: string;
  pricePerUSDNew: string;
  chainId: number;
  lastUpdatedTimestamp: string;
}

interface TokenPriceHistoryData {
  TokenPriceSnapshot?: TokenPriceSnapshot[];
}

const PERIOD_TO_DAYS: Record<HistoryPeriod, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "ALL": 365, // Cap at 1 year for performance
};

export function usePortfolioHistory(
  tokenList: Token[],
  period: HistoryPeriod = "1M"
): UsePortfolioHistoryResult {
  const { address: userAddress } = useAccount();
  const chainId = useChainId();
  const { positions } = useUserPositions();

  // Get current token balances
  const balances = useTokenBalances(tokenList, !!userAddress);

  // Extract all unique token addresses (from wallet + LP positions)
  const allTokenAddresses = useMemo(() => {
    const addresses = new Set<Address>();

    // Add tokens from token list that have balances
    tokenList.forEach(token => {
      const balance = balances.get(token.address);
      if (balance && balance > BigInt(0)) {
        addresses.add(token.address.toLowerCase() as Address);
      }
    });

    // Add tokens from LP positions (important for chart even if no current balance)
    positions.forEach(position => {
      addresses.add(position.pool.token0.address.toLowerCase() as Address);
      addresses.add(position.pool.token1.address.toLowerCase() as Address);
    });

    return Array.from(addresses);
  }, [tokenList, balances, positions]);

  // Create token map for quick lookup
  const tokenMap = useMemo(() => {
    const map = new Map<Address, Token>();
    tokenList.forEach(token => map.set(token.address, token));
    positions.forEach(position => {
      map.set(position.pool.token0.address, position.pool.token0);
      map.set(position.pool.token1.address, position.pool.token1);
    });
    return map;
  }, [tokenList, positions]);

  // Calculate start time as ISO 8601 string (Hasura timestamptz format)
  const startTime = useMemo(() => {
    const days = PERIOD_TO_DAYS[period];
    const ms = Date.now() - days * 86400 * 1000;
    return new Date(ms).toISOString();
  }, [period]);

  // Fetch historical price data
  const shouldFetch = userAddress && (allTokenAddresses.length > 0 || positions.length > 0);

  const { data, loading, error } = useQuery<TokenPriceHistoryData>(GET_MULTI_TOKEN_PRICE_HISTORY, {
    client: apolloClient,
    variables: {
      addresses: allTokenAddresses,
      chainId,
      startTime,
    },
    skip: !shouldFetch,
    fetchPolicy: "cache-first",
    nextFetchPolicy: "cache-first",
  });

  // Process historical data
  const historyData = useMemo(() => {
    if (!data?.TokenPriceSnapshot || data.TokenPriceSnapshot.length === 0) {
      return [];
    }

    // Group price data by timestamp
    const pricesByTimestamp = new Map<number, Map<Address, number>>();

    data.TokenPriceSnapshot.forEach((snapshot) => {
      // Parse the timestamp — Envio stores as ISO string
      const ts = Math.floor(new Date(snapshot.lastUpdatedTimestamp).getTime() / 1000);
      // Round to day boundary for aggregation
      const dayTs = Math.floor(ts / 86400) * 86400;
      const tokenAddr = snapshot.address.toLowerCase() as Address;
      const priceUSD = parseFloat(snapshot.pricePerUSDNew || "0");

      if (!allTokenAddresses.includes(tokenAddr)) return;

      if (!pricesByTimestamp.has(dayTs)) {
        pricesByTimestamp.set(dayTs, new Map());
      }
      // Use the latest price for each token on a given day
      pricesByTimestamp.get(dayTs)!.set(tokenAddr, priceUSD);
    });

    // Calculate total portfolio value for each date
    const historyPoints: PortfolioHistoryPoint[] = [];
    const sortedDates = Array.from(pricesByTimestamp.keys()).sort((a, b) => a - b);

    sortedDates.forEach(date => {
      const prices = pricesByTimestamp.get(date)!;
      let totalValueUSD = 0;

      // Add token values
      tokenList.forEach(token => {
        const balance = balances.get(token.address);
        const price = prices.get(token.address.toLowerCase() as Address);

        if (balance && price) {
          const balanceFloat = Number(balance) / Math.pow(10, token.decimals);
          totalValueUSD += balanceFloat * price;
        }
      });

      // Add LP position values
      positions.forEach(position => {
        const token0Price = prices.get(position.pool.token0.address.toLowerCase() as Address);
        const token1Price = prices.get(position.pool.token1.address.toLowerCase() as Address);

        if (token0Price && token1Price) {
          const token0Amount =
            Number(position.token0Amount) /
            Math.pow(10, position.pool.token0.decimals);
          const token1Amount =
            Number(position.token1Amount) /
            Math.pow(10, position.pool.token1.decimals);

          totalValueUSD += token0Amount * token0Price + token1Amount * token1Price;
        }
      });

      historyPoints.push({
        timestamp: date,
        totalValueUSD,
      });
    });

    return historyPoints;
  }, [data, tokenList, balances, positions, allTokenAddresses]);

  return {
    data: historyData,
    isLoading: loading,
    error: error || null,
  };
}
