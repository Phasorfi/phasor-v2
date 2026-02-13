"use client";

import { useQuery } from "@apollo/client/react";
import { useMemo } from "react";
import { Address } from "viem";
import { useChainId } from "wagmi";
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

interface EnvioToken {
  id: string;
  address: string;
  symbol: string;
  name: string;
  decimals: string;
  pricePerUSDNew: string;
}

interface TokenPricesData {
  Token?: EnvioToken[];
}

export function useTokenPrices(tokenAddresses: Address[]): UseTokenPricesResult {
  const chainId = useChainId();

  const { data, loading, error } = useQuery<TokenPricesData>(GET_TOKEN_PRICES, {
    client: apolloClient,
    variables: {
      addresses: tokenAddresses.map(addr => addr.toLowerCase()),
      chainId,
    },
    skip: tokenAddresses.length === 0,
  });

  const prices = useMemo(() => {
    const priceMap = new Map<Address, TokenPrice>();

    if (!data?.Token) {
      return priceMap;
    }

    data.Token.forEach((token) => {
      const tokenAddress = token.address.toLowerCase() as Address;
      const priceUSD = parseFloat(token.pricePerUSDNew || "0");

      // 24h price change not available from Envio aggregates — set to 0
      priceMap.set(tokenAddress, {
        priceUSD,
        price24hAgo: priceUSD,
        change24h: 0,
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
