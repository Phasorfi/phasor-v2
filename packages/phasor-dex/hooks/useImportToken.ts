"use client";

import { useState, useEffect } from "react";
import { Address, isAddress } from "viem";
import { useReadContracts } from "wagmi";
import { Token } from "@/types";

const ERC20_ABI = [
  {
    constant: true,
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
] as const;

interface UseImportTokenResult {
  token: Token | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch token metadata from blockchain for unknown addresses
 * Used as fallback when user pastes an address not in the token list
 */
export function useImportToken(
  addressInput: string
): UseImportTokenResult {
  const [error, setError] = useState<string | null>(null);

  // Validate address format
  const validAddress = isAddress(addressInput) ? addressInput : null;

  // Fetch name, symbol, and decimals from the contract
  const { data, isLoading, isError, error: queryError } = useReadContracts({
    contracts: validAddress
      ? [
          {
            address: validAddress as Address,
            abi: ERC20_ABI,
            functionName: "name",
          },
          {
            address: validAddress as Address,
            abi: ERC20_ABI,
            functionName: "symbol",
          },
          {
            address: validAddress as Address,
            abi: ERC20_ABI,
            functionName: "decimals",
          },
        ]
      : undefined,
    query: {
      enabled: !!validAddress,
    },
  });

  useEffect(() => {
    if (!addressInput) {
      setError(null);
      return;
    }

    if (!validAddress) {
      setError("Invalid address format");
      return;
    }

    if (isError) {
      setError("Failed to fetch token data. This may not be a valid ERC20 token.");
      return;
    }

    setError(null);
  }, [addressInput, validAddress, isError]);

  // Parse results
  if (!validAddress || !data || isLoading) {
    return {
      token: null,
      isLoading: isLoading && !!validAddress,
      error,
    };
  }

  // Check if all calls succeeded
  const [nameResult, symbolResult, decimalsResult] = data;

  if (
    nameResult.status !== "success" ||
    symbolResult.status !== "success" ||
    decimalsResult.status !== "success"
  ) {
    return {
      token: null,
      isLoading: false,
      error: "Failed to fetch token data. This may not be a valid ERC20 token.",
    };
  }

  const token: Token = {
    address: validAddress as Address,
    name: nameResult.result as string,
    symbol: symbolResult.result as string,
    decimals: decimalsResult.result as number,
  };

  return {
    token,
    isLoading: false,
    error: null,
  };
}
