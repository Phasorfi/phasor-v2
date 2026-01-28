"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { Address } from "viem";
import { GET_TOKEN_PRICES } from "@/lib/graphql/queries";
import { apolloClient } from "@/lib/apollo-client";

export interface TokenPrice {
  priceUSD: number;
  price24hAgo: number;
  change24h: number;
}

export interface UseTokenPricesResult {
  prices: Map<Address, TokenPrice>;
  isLoading: boolean;
  error: Error | null;
}

interface TokenData {
  id: string;
  derivedETH: string;
}

interface TokenDayData {
  token: {
    id: string;
  };
  priceUSD: string;
}

interface TokenPricesData {
  bundle?: {
    ethPrice: string;
  };
  tokens?: TokenData[];
  tokenDayDatas?: TokenDayData[];
}

export function useTokenPrices(tokenAddresses: Address[]): UseTokenPricesResult {
  // Calculate timestamp for 24h ago (in seconds)
  const timestamp24hAgo = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return Math.floor((now - 86400) / 86400) * 86400; // Round to day boundary
  }, []);

  const { data, loading, error } = useQuery<TokenPricesData>(GET_TOKEN_PRICES, {
    client: apolloClient,
    variables: {
      tokenIds: tokenAddresses.map(addr => addr.toLowerCase()),
      timestamp24hAgo,
    },
    skip: tokenAddresses.length === 0,
    // Remove pollInterval to prevent too many requests
    // Data will still update when variables change or when manually refetched
  });

  const prices = useMemo(() => {
    const priceMap = new Map<Address, TokenPrice>();

    if (!data) {
      return priceMap;
    }

    const ethPrice = data.bundle?.ethPrice ? parseFloat(data.bundle.ethPrice) : 0;
    const tokens = data.tokens || [];
    const tokenDayDatas = data.tokenDayDatas || [];

    // Create a map of token ID to 24h price
    const price24hMap = new Map<string, number>();
    tokenDayDatas.forEach((dayData: any) => {
      price24hMap.set(
        dayData.token.id.toLowerCase(),
        parseFloat(dayData.priceUSD || "0")
      );
    });

    // Process each token
    tokens.forEach((token: any) => {
      const tokenId = token.id.toLowerCase() as Address;
      const derivedETH = parseFloat(token.derivedETH || "0");
      const currentPriceUSD = derivedETH * ethPrice;
      const price24hAgo = price24hMap.get(tokenId) || currentPriceUSD;

      // Calculate 24h change percentage
      const change24h =
        price24hAgo > 0
          ? ((currentPriceUSD - price24hAgo) / price24hAgo) * 100
          : 0;

      priceMap.set(tokenId, {
        priceUSD: currentPriceUSD,
        price24hAgo,
        change24h,
      });
    });

    return priceMap;
  }, [data]);

  return {
    prices,
    isLoading: loading,
    error: error || null,
  };
}
