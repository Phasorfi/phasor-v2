import { useReadContract, useReadContracts, useBalance, useAccount } from "wagmi";
import { Address, erc20Abi } from "viem";
import { useMemo } from "react";
import { Token } from "@/types";
import { NATIVE_TOKEN } from "@/config";

interface UseTokenBalanceResult {
  balance: bigint;
  formatted: string;
  isLoading: boolean;
  refetch: () => void;
}

export function useTokenBalance(token: Token | null): UseTokenBalanceResult {
  const { address: account } = useAccount();

  const isNative = token?.address?.toLowerCase() === NATIVE_TOKEN.address.toLowerCase();

  // Native balance
  const {
    data: nativeBalance,
    isLoading: nativeLoading,
    refetch: refetchNative,
  } = useBalance({
    address: account,
    query: {
      enabled: !!account && isNative,
    },
  });

  // ERC20 balance
  const {
    data: tokenBalance,
    isLoading: tokenLoading,
    refetch: refetchToken,
    error: tokenError,
  } = useReadContract({
    address: token?.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: {
      enabled: !!account && !!token && !isNative,
    },
  });
  
  if (!token || !account) {
    return {
      balance: BigInt(0),
      formatted: "0",
      isLoading: false,
      refetch: () => {},
    };
  }
  
  if (isNative) {
    const balance = nativeBalance?.value ?? BigInt(0);
    const decimals = nativeBalance?.decimals ?? 18;
    const formatted = balance ? (Number(balance) / Math.pow(10, decimals)).toFixed(4) : "0";

    return {
      balance,
      formatted,
      isLoading: nativeLoading,
      refetch: refetchNative,
    };
  }
  
  return {
    balance: tokenBalance ?? BigInt(0),
    formatted: tokenBalance ? String(tokenBalance) : "0",
    isLoading: tokenLoading,
    refetch: refetchToken,
  };
}

// Hook to get multiple token balances efficiently using multicall
export function useTokenBalances(tokens: Token[], enabled: boolean = true): Map<Address, bigint> {
  const { address: account } = useAccount();

  // Serialize token addresses to stabilize dependency - avoid recalculating on every render
  const tokenAddressesStr = useMemo(
    () => tokens.map(t => t.address).join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokens.length, tokens[0]?.address, tokens[tokens.length - 1]?.address]
  );

  // Separate native token from ERC20 tokens - memoized based on serialized addresses
  const erc20Tokens = useMemo(() =>
    tokens.filter(
      token => token.address.toLowerCase() !== NATIVE_TOKEN.address.toLowerCase()
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokenAddressesStr]
  );

  const hasNativeToken = useMemo(() =>
    tokens.some(
      token => token.address.toLowerCase() === NATIVE_TOKEN.address.toLowerCase()
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokenAddressesStr]
  );

  // Fetch native balance separately
  const { data: nativeBalance } = useBalance({
    address: account,
    query: {
      enabled: enabled && !!account && hasNativeToken,
      staleTime: 10_000, // Consider data fresh for 10 seconds
      gcTime: 30_000, // Keep in cache for 30 seconds
    },
  });

  // Memoize contracts array to prevent unnecessary re-fetches
  const contracts = useMemo(() =>
    erc20Tokens.map(token => ({
      address: token.address as Address,
      abi: erc20Abi,
      functionName: "balanceOf" as const,
      args: account ? [account] : undefined,
    })),
    [erc20Tokens, account]
  );

  // Batch fetch all ERC20 balances at once using multicall
  const { data: balanceData } = useReadContracts({
    contracts,
    query: {
      enabled: enabled && !!account && erc20Tokens.length > 0,
      staleTime: 10_000, // Consider data fresh for 10 seconds
      gcTime: 30_000, // Keep in cache for 30 seconds
    },
  });

  // Create a map of token address to balance - memoized
  return useMemo(() => {
    const balances = new Map<Address, bigint>();

    // Add native token balance if present
    if (hasNativeToken && nativeBalance) {
      balances.set(NATIVE_TOKEN.address, nativeBalance.value);
    }

    // Add ERC20 token balances
    erc20Tokens.forEach((token, index) => {
      const result = balanceData?.[index];
      const balance = result?.status === "success" ? (result.result as bigint) : BigInt(0);
      balances.set(token.address, balance);
    });

    return balances;
  }, [erc20Tokens, hasNativeToken, nativeBalance, balanceData]);
}
