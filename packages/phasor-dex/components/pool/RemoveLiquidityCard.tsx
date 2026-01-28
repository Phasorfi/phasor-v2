"use client";

import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle, ExternalLink } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useReadContracts, usePublicClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import { toast } from "sonner";
import { useUserPositions } from "@/hooks/useUserPositions";
import { formatTokenAmount, cn } from "@/lib/utils";
import { CONTRACTS, ROUTER_ABI, PAIR_ABI } from "@/config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsPopover } from "@/components/common/SettingsPopover";
import { BackgroundGradient } from "@/components/ui/background-gradient";
import { useSettingsStore } from "@/lib/store";
import { UserPosition } from "@/types";

export function RemoveLiquidityCard() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { slippageTolerance, deadline } = useSettingsStore();
  const { positions, isLoading: isPositionsLoading, refetch: refetchPositions } = useUserPositions();

  const [mounted, setMounted] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<UserPosition | null>(null);
  const [percentage, setPercentage] = useState(25);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-select first position if available
  useEffect(() => {
    if (positions.length > 0 && !selectedPosition) {
      setSelectedPosition(positions[0]);
    }
  }, [positions, selectedPosition]);

  // Calculate liquidity amount to remove
  const liquidityToRemove = useMemo(() => {
    if (!selectedPosition) return BigInt(0);
    return (selectedPosition.liquidity * BigInt(percentage)) / BigInt(100);
  }, [selectedPosition, percentage]);

  // Calculate token amounts user will receive
  const { amountAMin, amountBMin, amountA, amountB } = useMemo(() => {
    if (!selectedPosition || !selectedPosition.pool.totalSupply || selectedPosition.pool.totalSupply === BigInt(0)) {
      return { amountAMin: BigInt(0), amountBMin: BigInt(0), amountA: BigInt(0), amountB: BigInt(0) };
    }

    const pool = selectedPosition.pool;

    // Calculate amounts based on liquidity share
    const amountA = (liquidityToRemove * pool.reserve0) / pool.totalSupply;
    const amountB = (liquidityToRemove * pool.reserve1) / pool.totalSupply;

    // Apply slippage (slippageTolerance is in basis points, e.g., 50 = 0.5%)
    const slippageBps = BigInt(Math.floor(slippageTolerance));
    const amountAMin = (amountA * (BigInt(10000) - slippageBps)) / BigInt(10000);
    const amountBMin = (amountB * (BigInt(10000) - slippageBps)) / BigInt(10000);

    return { amountAMin, amountBMin, amountA, amountB };
  }, [selectedPosition, liquidityToRemove, slippageTolerance]);

  // Check LP token allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedPosition?.pool.address,
    abi: PAIR_ABI,
    functionName: "allowance",
    args: address && selectedPosition ? [address, CONTRACTS.ROUTER] : undefined,
    query: {
      enabled: !!address && !!selectedPosition,
    },
  });

  const needsApproval = useMemo(() => {
    if (liquidityToRemove === BigInt(0)) return false;
    return (allowance ?? BigInt(0)) < liquidityToRemove;
  }, [allowance, liquidityToRemove]);

  // Approve LP tokens
  const {
    writeContract: approveLP,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const { isLoading: isApproveLoading, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({
      hash: approveHash,
    });

  const isApproving = isApprovePending || isApproveLoading;

  // Remove liquidity
  const {
    writeContract: removeLiq,
    data: removeHash,
    isPending: isRemovePending,
  } = useWriteContract();

  const { isLoading: isRemoveLoading, isSuccess: isRemoveSuccess } =
    useWaitForTransactionReceipt({
      hash: removeHash,
    });

  const isRemoving = isRemovePending || isRemoveLoading;

  // Handle approve
  const handleApprove = async () => {
    if (!selectedPosition || !liquidityToRemove) return;

    try {
      approveLP({
        address: selectedPosition.pool.address,
        abi: PAIR_ABI,
        functionName: "approve",
        args: [CONTRACTS.ROUTER, liquidityToRemove],
      });
    } catch (error: any) {
      console.error("Approve error:", error);
      toast.error(error.message || "Failed to approve LP tokens");
    }
  };

  // Handle remove liquidity
  const handleRemove = async () => {
    if (!selectedPosition || !address || liquidityToRemove === BigInt(0)) return;

    try {
      const deadlineTimestamp = BigInt(Math.floor(Date.now() / 1000) + deadline * 60);

      // Safety check: ensure we're not trying to remove more than we have
      if (liquidityToRemove > selectedPosition.liquidity) {
        toast.error("Cannot remove more liquidity than you have");
        return;
      }

      // Safety check: ensure minimum amounts are not zero
      if (amountAMin === BigInt(0) || amountBMin === BigInt(0)) {
        toast.error("Minimum amounts cannot be zero");
        return;
      }

      removeLiq({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: "removeLiquidity",
        args: [
          selectedPosition.pool.token0.address,
          selectedPosition.pool.token1.address,
          liquidityToRemove,
          amountAMin,
          amountBMin,
          address,
          deadlineTimestamp,
        ],
      });
    } catch (error: any) {
      console.error("Remove liquidity error:", error);
      toast.error(error.message || "Failed to remove liquidity");
    }
  };

  // Refetch allowance after approval succeeds
  useEffect(() => {
    if (isApproveSuccess) {
      toast.success("LP tokens approved successfully!");
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Show success toast and navigate
  useEffect(() => {
    if (isRemoveSuccess && selectedPosition) {
      toast.success(
        <div className="flex items-center gap-3">
          <div>
            <p className="font-medium">Liquidity removed successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedPosition.pool.token0.symbol}/{selectedPosition.pool.token1.symbol}
            </p>
          </div>
        </div>,
        {
          duration: 3000,
        }
      );

      // Refetch positions data to ensure fresh data
      refetchPositions();

      // Navigate to pools page after a short delay
      setTimeout(() => {
        router.push("/pools");
      }, 1500);
    }
  }, [isRemoveSuccess, selectedPosition, router, refetchPositions]);

  const presets = [25, 50, 75, 100];

  // Render position selector button
  const renderPositionButton = (position: UserPosition, isSelected: boolean) => (
    <button
      key={position.pool.address}
      onClick={() => setSelectedPosition(position)}
      className={cn(
        "w-full p-4 rounded border transition-all",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary/50 bg-muted"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border-2 border-border overflow-hidden">
              {position.pool.token0.logoURI ? (
                <Image src={position.pool.token0.logoURI} alt={position.pool.token0.symbol} width={32} height={32} className="rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{position.pool.token0.symbol.charAt(0)}</span>
              )}
            </div>
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center border-2 border-border overflow-hidden">
              {position.pool.token1.logoURI ? (
                <Image src={position.pool.token1.logoURI} alt={position.pool.token1.symbol} width={32} height={32} className="rounded-full object-cover" />
              ) : (
                <span className="text-xs font-bold">{position.pool.token1.symbol.charAt(0)}</span>
              )}
            </div>
          </div>
          <div className="text-left">
            <p className="font-medium">
              {position.pool.token0.symbol}/{position.pool.token1.symbol}
            </p>
            <p className="text-sm text-muted-foreground">
              {formatTokenAmount(position.token0Amount, position.pool.token0.decimals, 4)} {position.pool.token0.symbol} +{" "}
              {formatTokenAmount(position.token1Amount, position.pool.token1.decimals, 4)} {position.pool.token1.symbol}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Your pool share</p>
          <p className="font-medium">{position.share.toFixed(2)}%</p>
        </div>
      </div>
    </button>
  );

  return (
    <BackgroundGradient className="rounded-[22px] p-[2px] w-full max-w-md mx-auto" variant="white">
      <Card className="w-full border-0">
        <CardContent className="p-6 space-y-6">
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
              <h2 className="text-xl font-semibold">Remove Liquidity</h2>
            </div>
            <SettingsPopover />
          </div>

          {/* Position Selection */}
          {!mounted || isPositionsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : positions.length === 0 ? (
            <div className="p-8 text-center space-y-4 rounded border border-border bg-muted">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium text-foreground">No liquidity positions found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Add liquidity to a pool first
                </p>
              </div>
              <Button onClick={() => router.push("/pools/add")} className="mt-2">
                Add Liquidity
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <label className="text-sm text-muted-foreground">Select position</label>
                <div className="space-y-2">
                  {positions.map((position) =>
                    renderPositionButton(position, selectedPosition?.pool.address === position.pool.address)
                  )}
                </div>
              </div>

              {selectedPosition && (
                <>
                  {/* Amount Slider */}
                  <div className="p-4 rounded border border-border bg-muted space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Amount to remove</span>
                      <span className="text-3xl font-bold">{percentage}%</span>
                    </div>

                    <Slider
                      value={[percentage]}
                      onValueChange={([value]) => setPercentage(value)}
                      max={100}
                      step={1}
                    />

                    <div className="flex gap-2">
                      {presets.map((preset) => (
                        <Button
                          key={preset}
                          variant={percentage === preset ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPercentage(preset)}
                          className="flex-1"
                        >
                          {preset}%
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Output Preview */}
                  <div className="p-4 rounded border border-border bg-muted space-y-3">
                    <h4 className="text-sm text-muted-foreground">You will receive</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 rounded bg-background border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border overflow-hidden">
                            {selectedPosition.pool.token0.logoURI ? (
                              <Image src={selectedPosition.pool.token0.logoURI} alt={selectedPosition.pool.token0.symbol} width={24} height={24} className="rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold">{selectedPosition.pool.token0.symbol.charAt(0)}</span>
                            )}
                          </div>
                          <span className="font-medium">{selectedPosition.pool.token0.symbol}</span>
                        </div>
                        <span className="font-medium">
                          {formatTokenAmount(amountA, selectedPosition.pool.token0.decimals, 4)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded bg-background border border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-background flex items-center justify-center border border-border overflow-hidden">
                            {selectedPosition.pool.token1.logoURI ? (
                              <Image src={selectedPosition.pool.token1.logoURI} alt={selectedPosition.pool.token1.symbol} width={24} height={24} className="rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-bold">{selectedPosition.pool.token1.symbol.charAt(0)}</span>
                            )}
                          </div>
                          <span className="font-medium">{selectedPosition.pool.token1.symbol}</span>
                        </div>
                        <span className="font-medium">
                          {formatTokenAmount(amountB, selectedPosition.pool.token1.decimals, 4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Prices and Details */}
                  <div className="p-3 rounded border border-border bg-muted space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rate</span>
                      <span className="font-medium">
                        1 {selectedPosition.pool.token0.symbol} ={" "}
                        {selectedPosition.pool.reserve0 > 0n
                          ? (Number(selectedPosition.pool.reserve1) / Number(selectedPosition.pool.reserve0)).toFixed(4)
                          : "0"}{" "}
                        {selectedPosition.pool.token1.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Slippage tolerance</span>
                      <span className="font-medium">{(slippageTolerance / 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </>
              )}

              {/* Action Button */}
              {!isConnected ? (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button size="lg" className="w-full" onClick={openConnectModal}>
                      Connect Wallet
                    </Button>
                  )}
                </ConnectButton.Custom>
              ) : !selectedPosition ? (
                <Button size="lg" className="w-full" disabled>
                  Select a position
                </Button>
              ) : liquidityToRemove === BigInt(0) ? (
                <Button size="lg" className="w-full" disabled>
                  Enter amount
                </Button>
              ) : needsApproval ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleApprove}
                  disabled={isApproving}
                >
                  {isApproving ? "Approving..." : "Approve LP Tokens"}
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? "Removing..." : "Remove Liquidity"}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </BackgroundGradient>
  );
}
