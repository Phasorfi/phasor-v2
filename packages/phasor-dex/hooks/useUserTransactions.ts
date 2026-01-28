"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { GET_USER_TRANSACTIONS } from "@/lib/graphql/queries";
import { PortfolioTransaction, Token } from "@/types";
import { Address } from "viem";

export interface UseUserTransactionsResult {
  transactions: PortfolioTransaction[];
  isLoading: boolean;
  error: Error | null;
  loadMore: () => void;
  hasMore: boolean;
}

interface TransactionToken {
  id: string;
  symbol: string;
  decimals: string;
}

interface TransactionPair {
  token0: TransactionToken;
  token1: TransactionToken;
}

interface MintData {
  id: string;
  timestamp: string;
  pair: TransactionPair;
  amount0: string;
  amount1: string;
  amountUSD: string;
  transaction: {
    id: string;
  };
}

interface BurnData {
  id: string;
  timestamp: string;
  pair: TransactionPair;
  amount0: string;
  amount1: string;
  amountUSD: string;
  transaction: {
    id: string;
  };
}

interface SwapData {
  id: string;
  timestamp: string;
  pair: TransactionPair;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  amountUSD: string;
  transaction: {
    id: string;
  };
}

interface UserTransactionsData {
  mints?: MintData[];
  burns?: BurnData[];
  swaps?: SwapData[];
}

const TRANSACTIONS_PER_PAGE = 50;

export function useUserTransactions(): UseUserTransactionsResult {
  const { address: userAddress } = useAccount();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, loading, error } = useQuery<UserTransactionsData>(GET_USER_TRANSACTIONS, {
    variables: {
      user: userAddress?.toLowerCase() || "",
      first: TRANSACTIONS_PER_PAGE * currentPage,
    },
    skip: !userAddress,
    // Remove pollInterval to prevent too many requests
  });

  const transactions = useMemo(() => {
    if (!data) {
      return [];
    }

    const allTransactions: PortfolioTransaction[] = [];

    // Process mints (add liquidity)
    (data.mints || []).forEach((mint: any) => {
      const token0: Token = {
        address: mint.pair.token0.id as Address,
        symbol: mint.pair.token0.symbol,
        name: mint.pair.token0.symbol,
        decimals: mint.pair.token0.decimals,
      };

      const token1: Token = {
        address: mint.pair.token1.id as Address,
        symbol: mint.pair.token1.symbol,
        name: mint.pair.token1.symbol,
        decimals: mint.pair.token1.decimals,
      };

      allTransactions.push({
        id: mint.id,
        type: "mint",
        timestamp: parseInt(mint.timestamp),
        token0,
        token1,
        amount0: parseFloat(mint.amount0 || "0").toString(),
        amount1: parseFloat(mint.amount1 || "0").toString(),
        amountUSD: parseFloat(mint.amountUSD || "0"),
        hash: mint.transaction.id,
      });
    });

    // Process burns (remove liquidity)
    (data.burns || []).forEach((burn: any) => {
      const token0: Token = {
        address: burn.pair.token0.id as Address,
        symbol: burn.pair.token0.symbol,
        name: burn.pair.token0.symbol,
        decimals: burn.pair.token0.decimals,
      };

      const token1: Token = {
        address: burn.pair.token1.id as Address,
        symbol: burn.pair.token1.symbol,
        name: burn.pair.token1.symbol,
        decimals: burn.pair.token1.decimals,
      };

      allTransactions.push({
        id: burn.id,
        type: "burn",
        timestamp: parseInt(burn.timestamp),
        token0,
        token1,
        amount0: parseFloat(burn.amount0 || "0").toString(),
        amount1: parseFloat(burn.amount1 || "0").toString(),
        amountUSD: parseFloat(burn.amountUSD || "0"),
        hash: burn.transaction.id,
      });
    });

    // Sort all transactions by timestamp (newest first)
    return allTransactions.sort((a, b) => b.timestamp - a.timestamp);
  }, [data]);

  const hasMore = useMemo(() => {
    if (!data) return false;
    const totalFetched = transactions.length;
    const expectedMax = TRANSACTIONS_PER_PAGE * currentPage;
    return totalFetched >= expectedMax;
  }, [data, transactions.length, currentPage]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  return {
    transactions,
    isLoading: loading,
    error: error || null,
    loadMore,
    hasMore,
  };
}
