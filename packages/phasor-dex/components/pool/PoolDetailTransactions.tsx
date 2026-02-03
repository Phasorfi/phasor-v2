"use client";

import { useQuery } from "@apollo/client/react";
import { gql } from "@apollo/client";
import { ExternalLink, ArrowRightLeft, Plus, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apolloClient } from "@/lib/apollo-client";

// Simple time ago formatter
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface PoolDetailTransactionsProps {
  poolAddress: string;
}

const GET_POOL_TRANSACTIONS = gql`
  query GetPoolTransactions($pairAddress: String!) {
    swaps(
      where: { pair: $pairAddress }
      orderBy: timestamp
      orderDirection: desc
      first: 10
    ) {
      id
      timestamp
      amount0In
      amount1In
      amount0Out
      amount1Out
      amountUSD
      to
      transaction {
        id
      }
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }
    mints(
      where: { pair: $pairAddress }
      orderBy: timestamp
      orderDirection: desc
      first: 10
    ) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      to
      transaction {
        id
      }
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }
    burns(
      where: { pair: $pairAddress }
      orderBy: timestamp
      orderDirection: desc
      first: 10
    ) {
      id
      timestamp
      amount0
      amount1
      amountUSD
      sender
      transaction {
        id
      }
      pair {
        id
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }
  }
`;

type Transaction = {
  id: string;
  type: "swap" | "mint" | "burn";
  timestamp: number;
  token0Amount: string;
  token1Amount: string;
  amountUSD: string;
  account: string;
  txHash: string;
  token0Symbol: string;
  token1Symbol: string;
};

interface TokenInfo {
  id: string;
  symbol: string;
}

interface PairInfo {
  id: string;
  token0: TokenInfo;
  token1: TokenInfo;
}

interface SwapData {
  id: string;
  timestamp: string;
  amount0In: string;
  amount1In: string;
  amount0Out: string;
  amount1Out: string;
  amountUSD: string;
  to: string;
  transaction: { id: string };
  pair: PairInfo;
}

interface MintData {
  id: string;
  timestamp: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  to: string;
  transaction: { id: string };
  pair: PairInfo;
}

interface BurnData {
  id: string;
  timestamp: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  sender: string;
  transaction: { id: string };
  pair: PairInfo;
}

interface PoolTransactionsQueryResult {
  swaps: SwapData[];
  mints: MintData[];
  burns: BurnData[];
}

export function PoolDetailTransactions({ poolAddress }: PoolDetailTransactionsProps) {
  const { data, loading, error } = useQuery<PoolTransactionsQueryResult>(GET_POOL_TRANSACTIONS, {
    client: apolloClient,
    variables: { pairAddress: poolAddress.toLowerCase() },
  });

  // Combine and sort all transactions
  const transactions: Transaction[] = [];

  if (data) {
    data.swaps?.forEach((swap: any) => {
      const isToken0In = parseFloat(swap.amount0In) > 0;
      transactions.push({
        id: swap.id,
        type: "swap",
        timestamp: parseInt(swap.timestamp),
        token0Amount: isToken0In ? swap.amount0In : swap.amount0Out,
        token1Amount: isToken0In ? swap.amount1Out : swap.amount1In,
        amountUSD: swap.amountUSD,
        account: swap.to,
        txHash: swap.transaction.id,
        token0Symbol: swap.pair.token0.symbol,
        token1Symbol: swap.pair.token1.symbol,
      });
    });

    data.mints?.forEach((mint: any) => {
      transactions.push({
        id: mint.id,
        type: "mint",
        timestamp: parseInt(mint.timestamp),
        token0Amount: mint.amount0,
        token1Amount: mint.amount1,
        amountUSD: mint.amountUSD,
        account: mint.to,
        txHash: mint.transaction.id,
        token0Symbol: mint.pair.token0.symbol,
        token1Symbol: mint.pair.token1.symbol,
      });
    });

    data.burns?.forEach((burn: any) => {
      transactions.push({
        id: burn.id,
        type: "burn",
        timestamp: parseInt(burn.timestamp),
        token0Amount: burn.amount0,
        token1Amount: burn.amount1,
        amountUSD: burn.amountUSD,
        account: burn.sender,
        txHash: burn.transaction.id,
        token0Symbol: burn.pair.token0.symbol,
        token1Symbol: burn.pair.token1.symbol,
      });
    });
  }

  // Sort by timestamp descending
  transactions.sort((a, b) => b.timestamp - a.timestamp);

  const getIcon = (type: string) => {
    switch (type) {
      case "swap":
        return <ArrowRightLeft className="h-4 w-4" />;
      case "mint":
        return <Plus className="h-4 w-4" />;
      case "burn":
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "swap":
        return "text-blue-500";
      case "mint":
        return "text-green-500";
      case "burn":
        return "text-red-500";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground text-sm">Loading transactions...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <p className="text-destructive text-sm mb-2">Failed to load transactions</p>
              <p className="text-xs text-muted-foreground/70">
                {error.message}
              </p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex items-center justify-center h-32 bg-muted/20 rounded-lg border-2 border-dashed border-muted-foreground/20">
            <div className="text-center">
              <p className="text-muted-foreground text-sm mb-2">No transactions yet</p>
              <p className="text-xs text-muted-foreground/70">
                Swaps, adds, and removes will appear here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 10).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={getColor(tx.type)}>
                    {getIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize text-sm">{tx.type}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {parseFloat(tx.token0Amount).toFixed(4)} {tx.token0Symbol}
                      {tx.type === "swap" ? " → " : " + "}
                      {parseFloat(tx.token1Amount).toFixed(4)} {tx.token1Symbol}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="text-sm font-medium">
                    ${parseFloat(tx.amountUSD).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatTimeAgo(tx.timestamp)}</span>
                    <a
                      href={`https://explorer.monad.xyz/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground inline-flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
