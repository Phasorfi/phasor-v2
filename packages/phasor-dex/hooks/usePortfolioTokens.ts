"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { Address } from "viem";
import { useTokenBalances } from "./useTokenBalance";
import { useTokenPrices } from "./useTokenPrices";
import { PortfolioToken, Token } from "@/types";

export interface UsePortfolioTokensResult {
  tokens: PortfolioToken[];
  totalValue: number;
  isLoading: boolean;
}

export function usePortfolioTokens(tokenList: Token[]): UsePortfolioTokensResult {
  const { address: userAddress } = useAccount();

  // Get balances for all tokens
  const balances = useTokenBalances(tokenList, !!userAddress);

  // Debug logging
  console.log('Portfolio Debug:', {
    userAddress,
    balancesSize: balances.size,
    balancesEntries: Array.from(balances.entries()).map(([addr, bal]) => ({
      address: addr,
      balance: bal.toString()
    })),
    tokenListLength: tokenList.length,
    tokenListAddresses: tokenList.map(t => t.address)
  });

  // Extract token addresses that have non-zero balances
  const tokensWithBalance = useMemo(() => {
    return tokenList.filter(token => {
      const balance = balances.get(token.address);
      return balance && balance > BigInt(0);
    });
  }, [tokenList, balances]);

  const tokenAddresses = useMemo(
    () => tokensWithBalance.map(t => t.address),
    [tokensWithBalance]
  );

  // Get prices for tokens with balances
  const { prices, isLoading: pricesLoading } = useTokenPrices(tokenAddresses);

  // Combine balances and prices into portfolio tokens
  const portfolioTokens = useMemo(() => {
    const tokens: PortfolioToken[] = [];
    let totalValue = 0;

    tokensWithBalance.forEach(token => {
      const balance = balances.get(token.address) || BigInt(0);
      const priceData = prices.get(token.address.toLowerCase() as Address);

      if (!priceData || balance === BigInt(0)) {
        return;
      }

      const balanceFloat =
        Number(balance) / Math.pow(10, token.decimals);
      const valueUSD = balanceFloat * priceData.priceUSD;

      totalValue += valueUSD;

      tokens.push({
        token,
        balance,
        priceUSD: priceData.priceUSD,
        price24hAgo: priceData.price24hAgo,
        valueUSD,
        allocation: 0, // Will be calculated after we know total value
      });
    });

    // Calculate allocations
    if (totalValue > 0) {
      tokens.forEach(token => {
        token.allocation = (token.valueUSD / totalValue) * 100;
      });
    }

    // Sort by value (highest first)
    return tokens.sort((a, b) => b.valueUSD - a.valueUSD);
  }, [tokensWithBalance, balances, prices]);

  const totalValue = useMemo(() => {
    return portfolioTokens.reduce((sum, token) => sum + token.valueUSD, 0);
  }, [portfolioTokens]);

  return {
    tokens: portfolioTokens,
    totalValue,
    isLoading: pricesLoading,
  };
}
