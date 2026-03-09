"use client";

import React, { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, ChevronDown, AlertTriangle, ArrowDownUp, ExternalLink } from "lucide-react";
import { useAccount, useSwitchChain } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { Token } from "@/types";
import { useAddLiquidity, useTokenBalance } from "@/hooks";
import { formatTokenAmount, cn } from "@/lib/utils";
import { monad } from "@/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenSelector } from "@/components/common/TokenSelector";
import { SettingsPopover } from "@/components/common/SettingsPopover";
import { BackgroundGradient } from "@/components/ui/background-gradient";

interface TokenInputProps {
  label: string;
  token: Token | null;
  amount: string;
  onAmountChange: (value: string) => void;
  onTokenSelect: () => void;
  disabled?: boolean;
}

function TokenInput({
  label,
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  disabled,
}: TokenInputProps) {
  const { balance, isLoading: balanceLoading } = useTokenBalance(token);

  const handleMax = () => {
    if (token && balance > BigInt(0)) {
      onAmountChange(formatUnits(balance, token.decimals));
    }
  };

  return (
    <div className="rounded border border-border bg-muted p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {balanceLoading ? (
            <Skeleton className="h-4 w-16" />
          ) : (
            <>
              <span>Balance: {token ? formatTokenAmount(balance, token.decimals, 4) : "0"}</span>
              {token && balance > BigInt(0) && (
                <button
                  onClick={handleMax}
                  className="text-foreground hover:text-primary font-medium"
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
            const value = e.target.value;
            if (value === "" || /^[0-9]*[.,]?[0-9]*$/.test(value)) {
              onAmountChange(value.replace(",", "."));
            }
          }}
          disabled={disabled}
          className="token-input flex-1 min-w-0"
        />

        <Button
          variant="secondary"
          onClick={onTokenSelect}
          className="flex items-center gap-2 px-3 h-10 rounded-xl shrink-0"
        >
          {token ? (
            <>
              <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                {token.logoURI ? (
                  <Image src={token.logoURI} alt={token.symbol} width={24} height={24} className="rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{token.symbol.charAt(0)}</span>
                )}
              </div>
              <span className="font-medium">{token.symbol}</span>
            </>
          ) : (
            <span className="text-foreground">Select token</span>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function AddLiquidityCard() {
  const router = useRouter();
  const { isConnected, chain } = useAccount();
  const { switchChain } = useSwitchChain();

  const [mounted, setMounted] = useState(false);
  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selectorOpen, setSelectorOpen] = useState<"A" | "B" | null>(null);
  const [activeField, setActiveField] = useState<"A" | "B">("A");

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    quote,
    isLoading,
    exists,
    reserveA,
    reserveB,
    totalSupply,
    needsApprovalA,
    needsApprovalB,
    isApproving,
    isAdding,
    isSuccess,
    approveA,
    approveB,
    addLiquidity,
    error,
    calculateAmountB,
    calculateAmountA,
    gasEstimate,
    gasCost,
  } = useAddLiquidity(tokenA, tokenB, amountA, amountB);

  // Auto-calculate paired amount when pool exists
  useEffect(() => {
    if (!exists || isLoading) return;

    if (activeField === "A" && amountA && tokenA && tokenB) {
      const calculated = calculateAmountB(amountA);
      if (calculated) setAmountB(calculated);
    } else if (activeField === "B" && amountB && tokenA && tokenB) {
      const calculated = calculateAmountA(amountB);
      if (calculated) setAmountA(calculated);
    }
  }, [amountA, amountB, activeField, exists, isLoading, calculateAmountA, calculateAmountB, tokenA, tokenB]);

  // Show success toast with link to view pool
  useEffect(() => {
    if (isSuccess && tokenA && tokenB) {
      toast.success(
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium">Liquidity added successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {tokenA.symbol}/{tokenB.symbol}
            </p>
          </div>
        </div>,
        {
          action: {
            label: (
              <span className="flex items-center gap-1">
                View Pool <ExternalLink className="h-3 w-3" />
              </span>
            ),
            onClick: () => router.push("/pools"),
          },
          duration: 10000,
        }
      );

      // Reset form
      setAmountA("");
      setAmountB("");
    }
  }, [isSuccess, tokenA, tokenB, router]);

  const handleAmountAChange = (value: string) => {
    setActiveField("A");
    setAmountA(value);
  };

  const handleAmountBChange = (value: string) => {
    setActiveField("B");
    setAmountB(value);
  };

  // Handle token switching
  const handleSwitch = useCallback(() => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountA(amountB);
    setAmountB(amountA);
    setActiveField(activeField === "A" ? "B" : "A");
  }, [tokenA, tokenB, amountA, amountB, activeField]);

  // Handle token selection - swap positions if selecting the other token
  const handleSelectToken = (token: Token) => {
    if (selectorOpen === "A") {
      if (tokenB?.address === token.address) {
        // Swap the tokens
        setTokenA(tokenB);
        setTokenB(tokenA);
        setAmountA(amountB);
        setAmountB(amountA);
        setActiveField("A");
      } else {
        setTokenA(token);
        setAmountA("");
        setAmountB("");
      }
    } else {
      if (tokenA?.address === token.address) {
        // Swap the tokens
        setTokenB(tokenA);
        setTokenA(tokenB);
        setAmountB(amountA);
        setAmountA(amountB);
        setActiveField("B");
      } else {
        setTokenB(token);
        setAmountA("");
        setAmountB("");
      }
    }
  };

  // Check if on wrong chain
  const isWrongChain = isConnected && chain?.id !== monad.id;

  // Button state
  const buttonState = (() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true, action: null };
    if (isWrongChain) return { text: `Switch to ${monad.name}`, disabled: false, action: "switchChain" };
    if (!tokenA || !tokenB) return { text: "Select tokens", disabled: true, action: null };
    if (!amountA || !amountB || amountA === "0" || amountB === "0") {
      return { text: "Enter amounts", disabled: true, action: null };
    }
    if (isLoading) return { text: "Loading...", disabled: true, action: null };
    if (needsApprovalA) return { text: `Approve ${tokenA.symbol}`, disabled: false, action: "approveA" };
    if (needsApprovalB) return { text: `Approve ${tokenB.symbol}`, disabled: false, action: "approveB" };
    if (isApproving) return { text: "Approving...", disabled: true, action: null };
    if (isAdding) return { text: "Adding liquidity...", disabled: true, action: null };
    return { text: "Add Liquidity", disabled: false, action: "add" };
  })();

  const handleButtonClick = async () => {
    if (buttonState.action === "switchChain") {
      switchChain({ chainId: monad.id });
    } else if (buttonState.action === "approveA") {
      await approveA();
    } else if (buttonState.action === "approveB") {
      await approveB();
    } else if (buttonState.action === "add") {
      await addLiquidity();
    }
  };

  return (
    <>
      <BackgroundGradient variant="white" className="w-full max-w-md mx-auto">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/pools")}
                className="rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold">Add Liquidity</h2>
            </div>
            <SettingsPopover />
          </div>

          <div className="space-y-3">
          {/* First Token */}
          <TokenInput
            label="Token A"
            token={tokenA}
            amount={amountA}
            onAmountChange={handleAmountAChange}
            onTokenSelect={() => setSelectorOpen("A")}
          />

          {/* Switch Button */}
          <div className="flex justify-center -my-1">
            <button
              onClick={handleSwitch}
              className="p-2 rounded border border-border bg-card hover:bg-muted transition-all"
            >
              <ArrowDownUp className="h-5 w-5" />
            </button>
          </div>

          {/* Second Token */}
          <TokenInput
            label="Token B"
            token={tokenB}
            amount={amountB}
            onAmountChange={handleAmountBChange}
            onTokenSelect={() => setSelectorOpen("B")}
          />

          {/* Pool Info */}
          {tokenA && tokenB && (
            <div className="p-4 rounded border border-border bg-secondary space-y-3">
              {!isLoading && !exists ? (
                <div className="flex items-start gap-2 text-yellow-500">
                  <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Creating new pool</p>
                    <p className="text-muted-foreground">
                      You are the first to provide liquidity. The ratio you set will
                      determine the initial price.
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <>
                  <h4 className="font-medium">Current Price</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tokenA.symbol} per {tokenB.symbol}
                      </span>
                      <span className="font-medium">
                        {reserveA > BigInt(0) && reserveB > BigInt(0)
                          ? (Number(formatUnits(reserveA, tokenA.decimals)) /
                             Number(formatUnits(reserveB, tokenB.decimals))).toFixed(6)
                          : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {tokenB.symbol} per {tokenA.symbol}
                      </span>
                      <span className="font-medium">
                        {reserveA > BigInt(0) && reserveB > BigInt(0)
                          ? (Number(formatUnits(reserveB, tokenB.decimals)) /
                             Number(formatUnits(reserveA, tokenA.decimals))).toFixed(6)
                          : "-"}
                      </span>
                    </div>
                    {quote && amountA && amountB && (
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Share of pool</span>
                        <span className="font-medium">
                          {quote.shareOfPool.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {gasEstimate && gasCost && (
                      <div className="flex justify-between pt-2 border-t border-border">
                        <span className="text-muted-foreground">Estimated gas</span>
                        <span className="font-medium">
                          {gasEstimate} ({gasCost})
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Action Button */}
          {!mounted ? (
            <Button
              className="w-full py-6 font-semibold"
              disabled
            >
              Loading...
            </Button>
          ) : !isConnected ? (
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button
                  className="w-full py-6 font-semibold"
                  onClick={openConnectModal}
                >
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          ) : (
            <Button
              className={cn(
                "w-full py-6 font-semibold",
                buttonState.disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={buttonState.disabled}
              onClick={handleButtonClick}
            >
              {isApproving || isAdding ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {buttonState.text}
                </div>
              ) : (
                buttonState.text
              )}
            </Button>
          )}
          </div>
        </CardContent>
      </Card>
      </BackgroundGradient>

      {/* Token Selector */}
      <TokenSelector
        open={selectorOpen !== null}
        onClose={() => setSelectorOpen(null)}
        onSelect={handleSelectToken}
        selectedToken={selectorOpen === "A" ? tokenA : tokenB}
        otherToken={selectorOpen === "A" ? tokenB : tokenA}
      />
    </>
  );
}
