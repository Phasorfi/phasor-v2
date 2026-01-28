"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useUserPositions } from "./useUserPositions";
import { useTokenPrices } from "./useTokenPrices";
import { Address } from "viem";

export interface UsePortfolioValueResult {
  totalValue: number;
  value24hAgo: number;
  change24h: number;
  change24hPercent: number;
  tokenValue: number;
  lpValue: number;
  isLoading: boolean;
}

export function usePortfolioValue(tokenValue: number): UsePortfolioValueResult {
  const { address: userAddress } = useAccount();
  const { positions, isLoading: positionsLoading } = useUserPositions();

  // Extract all unique token addresses from LP positions
  const lpTokenAddresses = useMemo(() => {
    const addresses = new Set<Address>();
    positions.forEach(position => {
      addresses.add(position.pool.token0.address);
      addresses.add(position.pool.token1.address);
    });
    return Array.from(addresses);
  }, [positions]);

  // Get prices for LP position tokens
  const { prices, isLoading: pricesLoading } = useTokenPrices(lpTokenAddresses);

  // Calculate LP position values
  const lpValues = useMemo(() => {
    let totalLpValue = 0;
    let totalLpValue24hAgo = 0;

    positions.forEach(position => {
      const token0Price = prices.get(position.pool.token0.address);
      const token1Price = prices.get(position.pool.token1.address);

      if (!token0Price || !token1Price) {
        return;
      }

      // Current value
      const token0Amount =
        Number(position.token0Amount) / Math.pow(10, position.pool.token0.decimals);
      const token1Amount =
        Number(position.token1Amount) / Math.pow(10, position.pool.token1.decimals);

      const token0Value = token0Amount * token0Price.priceUSD;
      const token1Value = token1Amount * token1Price.priceUSD;
      const positionValue = token0Value + token1Value;

      totalLpValue += positionValue;

      // 24h ago value
      const token0Value24h = token0Amount * token0Price.price24hAgo;
      const token1Value24h = token1Amount * token1Price.price24hAgo;
      const positionValue24h = token0Value24h + token1Value24h;

      totalLpValue24hAgo += positionValue24h;
    });

    return {
      current: totalLpValue,
      value24hAgo: totalLpValue24hAgo,
    };
  }, [positions, prices]);

  // Calculate total portfolio value and changes
  const portfolioMetrics = useMemo(() => {
    const totalValue = tokenValue + lpValues.current;

    // For 24h ago value calculation, we need to estimate
    // Since we don't track historical balances, we use current balances with historical prices
    // This is an approximation
    const value24hAgo = tokenValue + lpValues.value24hAgo;

    const change24h = totalValue - value24hAgo;
    const change24hPercent = value24hAgo > 0 ? (change24h / value24hAgo) * 100 : 0;

    return {
      totalValue,
      value24hAgo,
      change24h,
      change24hPercent,
      tokenValue,
      lpValue: lpValues.current,
    };
  }, [tokenValue, lpValues]);

  return {
    ...portfolioMetrics,
    isLoading: positionsLoading || pricesLoading,
  };
}
