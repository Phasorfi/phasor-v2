"use client";

import Image from "next/image";
import { PortfolioToken } from "@/types";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenRowProps {
  token: PortfolioToken;
}

export function TokenRow({ token }: TokenRowProps) {
  const balanceFloat = Number(token.balance) / Math.pow(10, token.token.decimals);
  const priceChange = token.priceUSD - token.price24hAgo;
  const priceChangePercent =
    token.price24hAgo > 0 ? ((priceChange / token.price24hAgo) * 100) : 0;
  const isPriceUp = priceChange >= 0;

  return (
    <>
      {/* Desktop Row */}
      <tr className="hidden md:table-row border-b border-border hover:bg-muted/50 transition-colors">
        {/* Token */}
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            {token.token.logoURI ? (
              <Image
                src={token.token.logoURI}
                alt={token.token.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {token.token.symbol.substring(0, 2)}
              </div>
            )}
            <div>
              <div className="font-medium">{token.token.symbol}</div>
              <div className="text-sm text-muted-foreground">{token.token.name}</div>
            </div>
          </div>
        </td>

        {/* Price */}
        <td className="py-4 px-4">
          ${token.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </td>

        {/* 24h Change */}
        <td className="py-4 px-4">
          <div className={cn("flex items-center gap-1", isPriceUp ? "text-green-500" : "text-red-500")}>
            {isPriceUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
          </div>
        </td>

        {/* Balance */}
        <td className="py-4 px-4">
          {balanceFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </td>

        {/* Value */}
        <td className="py-4 px-4 font-medium">
          ${token.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>

        {/* Allocation */}
        <td className="py-4 px-4 text-muted-foreground">
          {token.allocation.toFixed(2)}%
        </td>
      </tr>

      {/* Mobile Card */}
      <div className="md:hidden border border-border rounded-lg p-4 mb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {token.token.logoURI ? (
              <Image
                src={token.token.logoURI}
                alt={token.token.symbol}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {token.token.symbol.substring(0, 2)}
              </div>
            )}
            <div>
              <div className="font-medium">{token.token.symbol}</div>
              <div className="text-sm text-muted-foreground">{token.token.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">
              ${token.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-muted-foreground">{token.allocation.toFixed(2)}%</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Price</div>
            <div className="font-medium">
              ${token.priceUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">24h</div>
            <div className={cn("font-medium", isPriceUp ? "text-green-500" : "text-red-500")}>
              {priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Balance</div>
            <div className="font-medium">
              {balanceFloat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
