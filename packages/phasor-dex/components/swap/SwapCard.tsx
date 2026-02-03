"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Repeat2, ChevronDown, Loader2 } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { Token } from "@/types";
import { useSwap, useTokenBalance } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSelector } from "@/components/common/TokenSelector";
import { SettingsPopover } from "@/components/common/SettingsPopover";
import { DEFAULT_TOKENS } from "@/config/chains";

interface TokenInputProps {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  disabled?: boolean;
  showMaxButton?: boolean;
}

function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  disabled,
  showMaxButton,
}: TokenInputProps) {
  const { balance, isLoading: balanceLoading } = useTokenBalance(token);

  const handleMax = () => {
    if (token && balance > BigInt(0)) {
      onAmountChange(formatUnits(balance, token.decimals));
    }
  };

  return (
    <div className="bg-white/5 rounded-xl p-3 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-white">{label}</span>
        <div className="flex items-center gap-2 text-xs text-white">
          {balanceLoading ? (
            <Skeleton className="h-4 w-16 bg-white/10" />
          ) : (
            <>
              <span>Balance: {token ? formatTokenAmount(balance, token.decimals, 4) : "0"}</span>
              {showMaxButton && token && balance > BigInt(0) && (
                <button
                  onClick={handleMax}
                  className="text-white font-medium transition-colors"
                >
                  MAX
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(e) => {
            // Only allow valid number input
            const value = e.target.value;
            if (value === "" || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
              onAmountChange(value.replace(",", "."));
            }
          }}
          disabled={disabled}
          className="bg-transparent text-xl md:text-2xl font-mono font-medium placeholder:text-white focus:outline-none w-full flex-1 min-w-0 text-white"
        />

        <button
          onClick={onTokenSelect}
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors shrink-0"
        >
          {token ? (
            <>
              <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <Image
                    src={token.logoURI}
                    alt={token.symbol}
                    width={16}
                    height={16}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-white">
                    {token.symbol.charAt(0)}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-white">{token.symbol}</span>
            </>
          ) : (
            <span className="text-xs text-white">Select token</span>
          )}
          <ChevronDown className="h-3 w-3 text-white" />
        </button>
      </div>
    </div>
  );
}

export function SwapCard() {
  const { isConnected, address } = useAccount();
  const searchParams = typeof window !== "undefined" ? useSearchParams() : null;
  const [mounted, setMounted] = useState(false);

  const [inputToken, setInputToken] = useState<Token | null>(null);
  const [outputToken, setOutputToken] = useState<Token | null>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [selectorOpen, setSelectorOpen] = useState<"input" | "output" | null>(null);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-select tokens from URL parameters
  useEffect(() => {
    if (!mounted || !searchParams) return;

    const inputCurrency = searchParams.get("inputCurrency");
    const outputCurrency = searchParams.get("outputCurrency");

    if (inputCurrency && !inputToken) {
      const token = DEFAULT_TOKENS.find(
        (t) => t.address.toLowerCase() === inputCurrency.toLowerCase()
      );
      if (token) {
        setInputToken(token);
      }
    }

    if (outputCurrency && !outputToken) {
      const token = DEFAULT_TOKENS.find(
        (t) => t.address.toLowerCase() === outputCurrency.toLowerCase()
      );
      if (token) {
        setOutputToken(token);
      }
    }
  }, [mounted, searchParams, inputToken, outputToken]);

  const {
    quote,
    isLoading,
    needsApproval,
    isApproving,
    isSwapping,
    approve,
    swap,
    error,
    gasEstimate,
    gasCost,
  } = useSwap(inputToken, outputToken, inputAmount);

  // Handle token switch
  const handleSwitch = useCallback(() => {
    setInputToken(outputToken);
    setOutputToken(inputToken);
    setInputAmount("");
  }, [inputToken, outputToken]);

  // Handle token selection - swap positions if selecting the other token
  const handleSelectToken = (token: Token) => {
    if (selectorOpen === "input") {
      if (outputToken?.address === token.address) {
        // Swap the tokens
        setInputToken(outputToken);
        setOutputToken(inputToken);
      } else {
        setInputToken(token);
      }
    } else {
      if (inputToken?.address === token.address) {
        // Swap the tokens
        setOutputToken(inputToken);
        setInputToken(outputToken);
      } else {
        setOutputToken(token);
      }
    }
  };

  // Format output amount
  const outputAmount = useMemo(() => {
    if (!quote || !outputToken) return "";
    return formatUnits(quote.amountOut, outputToken.decimals);
  }, [quote, outputToken]);

  // Determine button state
  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true, action: null };
    if (!inputToken || !outputToken) return { text: "Select tokens", disabled: true, action: null };
    if (!inputAmount || inputAmount === "0") return { text: "Enter amount", disabled: true, action: null };
    if (isLoading) return { text: "Loading...", disabled: true, action: null };
    if (!quote) return { text: "Insufficient liquidity", disabled: true, action: null };
    if (needsApproval) return { text: `Approve ${inputToken.symbol}`, disabled: false, action: "approve" };
    if (isApproving) return { text: "Approving...", disabled: true, action: null };
    if (isSwapping) return { text: "Swapping...", disabled: true, action: null };
    return { text: "Swap", disabled: false, action: "swap" };
  }, [isConnected, inputToken, outputToken, inputAmount, isLoading, quote, needsApproval, isApproving, isSwapping]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") {
      await approve();
    } else if (buttonState.action === "swap") {
      await swap();
    }
  };

  return (
    <>
      <div className="w-full max-w-[320px]">
        {/* Header - outside card, no background */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-mono text-white">// SWAP</h2>
          <div className="scale-75 origin-right">
            <SettingsPopover />
          </div>
        </div>

        {/* Swap Card */}
        <div className="space-y-2">
          {/* Input */}
          <TokenInput
            label="You pay"
            token={inputToken}
            amount={inputAmount}
            onAmountChange={setInputAmount}
            onTokenSelect={() => setSelectorOpen("input")}
            showMaxButton
          />

          {/* Switch Button */}
          <div className="flex justify-center -my-1 relative z-10">
            <button
              onClick={handleSwitch}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all swap-arrow"
            >
              <Repeat2 className="h-4 w-4 text-[#756da7]" />
            </button>
          </div>

          {/* Output */}
          <TokenInput
            label="You receive"
            token={outputToken}
            amount={outputAmount}
            onAmountChange={() => {}} // Output is calculated
            onTokenSelect={() => setSelectorOpen("output")}
            disabled
          />

          {/* Price Info */}
          {quote && inputToken && outputToken && (
            <div className="space-y-2 p-3 rounded-lg bg-white/5 border border-white/5 text-sm">
              <div className="flex justify-between">
                <span className="text-white">Rate</span>
                <span className="text-white">
                  1 {inputToken.symbol} ≈{" "}
                  {(Number(quote.amountOut) / Number(quote.amountIn) *
                    Math.pow(10, inputToken.decimals - outputToken.decimals)).toFixed(6)}{" "}
                  {outputToken.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Price Impact</span>
                <span
                  className={cn(
                    quote.priceImpact > 3
                      ? "text-red-400"
                      : quote.priceImpact > 1
                      ? "text-yellow-400"
                      : "text-green-400"
                  )}
                >
                  {quote.priceImpact.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Minimum received</span>
                <span className="text-white">
                  {formatTokenAmount(quote.minimumReceived, outputToken.decimals, 6)}{" "}
                  {outputToken.symbol}
                </span>
              </div>
              {gasEstimate && gasCost && (
                <div className="flex justify-between">
                  <span className="text-white">Estimated gas</span>
                  <span className="text-white">
                    {gasEstimate} ({gasCost})
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Action Button - hidden when "Select tokens" */}
          {buttonState.text !== "Select tokens" && (
            <div className="pt-2">
              {!mounted || !isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      className="w-full py-5 font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg"
                      onClick={openConnectModal}
                      disabled={!mounted}
                    >
                      {mounted ? "Connect Wallet" : "Loading..."}
                    </Button>
                  )}
                </ConnectButton.Custom>
              ) : (
                <Button
                  className={cn(
                    "w-full py-5 font-medium bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg",
                    buttonState.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={handleButtonClick}
                  disabled={buttonState.disabled}
                >
                  {isApproving || isSwapping ? (
                    <div className="flex items-center gap-2 justify-center">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {buttonState.text}
                    </div>
                  ) : (
                    buttonState.text
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Token Selector Modal */}
      <TokenSelector
        open={selectorOpen !== null}
        onClose={() => setSelectorOpen(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorOpen === "input" ? inputToken : outputToken}
        otherToken={selectorOpen === "input" ? outputToken : inputToken}
      />
    </>
  );
}
