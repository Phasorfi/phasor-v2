"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PortfolioTransaction } from "@/types";
import { ExternalLink } from "lucide-react";

interface ActivityRowProps {
  transaction: PortfolioTransaction;
}

function formatTimestamp(timestamp: number, now: number): string {
  const diff = now - timestamp;

  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

  return new Date(timestamp * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatTransactionType(type: string): string {
  switch (type.toLowerCase()) {
    case "swap":
      return "Swap";
    case "mint":
      return "Add Liquidity";
    case "burn":
      return "Remove Liquidity";
    default:
      return type;
  }
}

// Desktop table row component
export function ActivityRow({ transaction }: ActivityRowProps) {
  const explorerUrl = `https://monad.explorer/tx/${transaction.hash}`;
  const [now, setNow] = useState(0);

  // Use client-side time to avoid hydration mismatch
  useEffect(() => {
    setNow(Date.now() / 1000);
  }, []);

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      {/* Time */}
      <td className="py-4 px-4 text-muted-foreground">
        {now > 0 ? formatTimestamp(transaction.timestamp, now) : "-"}
      </td>

      {/* Type */}
      <td className="py-4 px-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
          {formatTransactionType(transaction.type)}
        </span>
      </td>

      {/* Amount */}
      <td className="py-4 px-4">
        <div className="text-sm">
          {transaction.amount0 && (
            <div className={transaction.type === "swap" && transaction.amount0.startsWith("-") ? "text-red-500" : ""}>
              {transaction.amount0} {transaction.token0?.symbol}
            </div>
          )}
          {transaction.amount1 && (
            <div className={transaction.type === "swap" && transaction.amount1.startsWith("-") ? "text-red-500" : ""}>
              {transaction.amount1} {transaction.token1?.symbol}
            </div>
          )}
        </div>
      </td>

      {/* Value */}
      <td className="py-4 px-4">
        <div className="text-sm font-medium">
          {transaction.amountUSD ? `$${Number(transaction.amountUSD).toFixed(2)}` : "-"}
        </div>
      </td>

      {/* Transaction */}
      <td className="py-4 px-4">
        <Link
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <span className="font-mono">
            {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
          </span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}

// Mobile card component
export function ActivityCard({ transaction }: ActivityRowProps) {
  const explorerUrl = `https://monad.explorer/tx/${transaction.hash}`;
  const [now, setNow] = useState(0);

  // Use client-side time to avoid hydration mismatch
  useEffect(() => {
    setNow(Date.now() / 1000);
  }, []);

  return (
    <div className="border border-border rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">
            {formatTransactionType(transaction.type)}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {now > 0 ? formatTimestamp(transaction.timestamp, now) : "-"}
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Amount:</span>
          <div className="text-right">
            {transaction.amount0 && (
              <div className={transaction.type === "swap" && transaction.amount0.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount0} {transaction.token0?.symbol}
              </div>
            )}
            {transaction.amount1 && (
              <div className={transaction.type === "swap" && transaction.amount1.startsWith("-") ? "text-red-500" : ""}>
                {transaction.amount1} {transaction.token1?.symbol}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-medium">
            {transaction.amountUSD ? `$${Number(transaction.amountUSD).toFixed(2)}` : "-"}
          </span>
        </div>
      </div>

      <Link
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <span className="font-mono">
          {transaction.hash.substring(0, 6)}...{transaction.hash.substring(transaction.hash.length - 4)}
        </span>
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
