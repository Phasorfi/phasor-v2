import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useGasPrice,
} from "wagmi";
import { Address, erc20Abi, parseUnits, formatUnits } from "viem";
import { Token, SwapQuote } from "@/types";
import { CONTRACTS, ROUTER_ABI, NATIVE_TOKEN } from "@/config";
import { useOrderedReserves } from "./usePair";
import { useSettingsStore, useTransactionStore } from "@/lib/store";
import {
  getAmountOut,
  getAmountIn,
  calculatePriceImpact,
  calculateMinimumReceived,
  getDeadline,
  calculateGasCost,
  formatGasEstimate,
} from "@/lib/utils";

interface UseSwapResult {
  quote: SwapQuote | null;
  isLoading: boolean;
  needsApproval: boolean;
  isApproving: boolean;
  isSwapping: boolean;
  approve: () => Promise<void>;
  swap: () => Promise<void>;
  error: string | null;
  gasEstimate?: string;
  gasCost?: string;
}

export function useSwap(
  inputToken: Token | null,
  outputToken: Token | null,
  inputAmount: string,
  isExactInput: boolean = true
): UseSwapResult {
  const { address: account } = useAccount();
  const { slippageTolerance, deadline } = useSettingsStore();
  const { addTransaction, updateTransaction } = useTransactionStore();
  
  const [error, setError] = useState<string | null>(null);

  // Get pair reserves
  const { reserveA, reserveB, isLoading: reservesLoading, exists } = useOrderedReserves(
    inputToken,
    outputToken
  );

  // Parse input amount
  const parsedAmount = useMemo(() => {
    if (!inputAmount || !inputToken) return BigInt(0);
    try {
      return parseUnits(inputAmount, inputToken.decimals);
    } catch {
      return BigInt(0);
    }
  }, [inputAmount, inputToken]);

  // Calculate quote
  const quote = useMemo((): SwapQuote | null => {
    if (!inputToken || !outputToken || parsedAmount === BigInt(0) || !exists) {
      return null;
    }

    const amountOut = getAmountOut(parsedAmount, reserveA, reserveB);
    
    if (amountOut === BigInt(0)) return null;

    const priceImpact = calculatePriceImpact(
      parsedAmount,
      amountOut,
      reserveA,
      reserveB
    );

    const minimumReceived = calculateMinimumReceived(amountOut, slippageTolerance);
    
    // Fee is 0.3% of input
    const fee = (parsedAmount * BigInt(3)) / BigInt(1000);

    return {
      amountIn: parsedAmount,
      amountOut,
      priceImpact,
      route: [inputToken, outputToken],
      minimumReceived,
      fee,
    };
  }, [inputToken, outputToken, parsedAmount, reserveA, reserveB, exists, slippageTolerance]);

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: inputToken?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: account ? [account, CONTRACTS.ROUTER] : undefined,
    query: {
      enabled:
        !!account &&
        !!inputToken &&
        inputToken.address !== NATIVE_TOKEN.address,
    },
  });

  const needsApproval = useMemo(() => {
    if (!inputToken || inputToken.address === NATIVE_TOKEN.address) return false;
    if (!allowance || !parsedAmount) return true;
    return allowance < parsedAmount;
  }, [inputToken, allowance, parsedAmount]);

  // Approval transaction
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({
    hash: approveHash,
  });

  // Handle successful approval transaction
  useEffect(() => {
    if (isApproveSuccess && approveHash) {
      // Update transaction status
      updateTransaction(approveHash, "confirmed");
      // Refetch allowance to update UI state
      refetchAllowance();
    }
  }, [isApproveSuccess, approveHash, updateTransaction, refetchAllowance]);

  // Swap transaction
  const {
    writeContract: writeSwap,
    data: swapHash,
    isPending: isSwapPending,
  } = useWriteContract();

  const { isLoading: isSwapConfirming } = useWaitForTransactionReceipt({
    hash: swapHash,
  });

  const approve = useCallback(async () => {
    if (!inputToken || !account) return;
    setError(null);

    try {
      writeApprove({
        address: inputToken.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACTS.ROUTER, parsedAmount],
      });

      if (approveHash) {
        addTransaction({
          hash: approveHash,
          type: "approve",
          summary: `Approve ${inputToken.symbol}`,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Approval failed");
    }
  }, [inputToken, account, parsedAmount, writeApprove, approveHash, addTransaction]);

  const swap = useCallback(async () => {
    if (!inputToken || !outputToken || !account || !quote) return;
    setError(null);

    const txDeadline = getDeadline(deadline);
    const path = [inputToken.address, outputToken.address];

    try {
      const isInputNative = inputToken.address === NATIVE_TOKEN.address;
      const isOutputNative = outputToken.address === NATIVE_TOKEN.address;

      if (isInputNative) {
        // Swap ETH for tokens
        writeSwap({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: "swapExactETHForTokens",
          args: [quote.minimumReceived, [CONTRACTS.WMON, outputToken.address], account, txDeadline],
          value: quote.amountIn,
        });
      } else if (isOutputNative) {
        // Swap tokens for ETH
        writeSwap({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: "swapExactTokensForETH",
          args: [quote.amountIn, quote.minimumReceived, [inputToken.address, CONTRACTS.WMON], account, txDeadline],
        });
      } else {
        // Swap tokens for tokens
        writeSwap({
          address: CONTRACTS.ROUTER,
          abi: ROUTER_ABI,
          functionName: "swapExactTokensForTokens",
          args: [quote.amountIn, quote.minimumReceived, path, account, txDeadline],
        });
      }

      if (swapHash) {
        addTransaction({
          hash: swapHash,
          type: "swap",
          summary: `Swap ${formatUnits(quote.amountIn, inputToken.decimals)} ${inputToken.symbol} for ${outputToken.symbol}`,
        });
      }
    } catch (err: any) {
      setError(err?.message || "Swap failed");
    }
  }, [inputToken, outputToken, account, quote, deadline, writeSwap, swapHash, addTransaction]);

  // Get current gas price
  const { data: gasPrice } = useGasPrice();

  // Static gas estimates based on Uniswap V2 typical usage
  // ETH swaps: ~127,000 gas
  // Token swaps: ~150,000 gas (includes approval check overhead)
  const estimatedGas = useMemo(() => {
    if (!quote || !inputToken || !outputToken) return undefined;

    // ETH involved swaps are cheaper
    if (inputToken.address === NATIVE_TOKEN.address || outputToken.address === NATIVE_TOKEN.address) {
      return BigInt(127000);
    }
    // Token to token swaps
    return BigInt(150000);
  }, [quote, inputToken, outputToken]);

  // Calculate gas cost display
  const { gasEstimate, gasCost } = useMemo(() => {
    if (!estimatedGas || !gasPrice) {
      return { gasEstimate: undefined, gasCost: undefined };
    }

    const formatted = formatGasEstimate(estimatedGas);
    const cost = calculateGasCost(estimatedGas, gasPrice);

    return {
      gasEstimate: `~${formatted}`,
      gasCost: cost.costInUSD || `${parseFloat(cost.costInNative).toFixed(6)} MON`,
    };
  }, [estimatedGas, gasPrice]);

  return {
    quote,
    isLoading: reservesLoading,
    needsApproval,
    isApproving: isApprovePending || isApproveConfirming,
    isSwapping: isSwapPending || isSwapConfirming,
    approve,
    swap,
    error,
    gasEstimate,
    gasCost,
  };
}
