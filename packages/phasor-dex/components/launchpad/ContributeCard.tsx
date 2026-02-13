"use client";

import React, { useState, useMemo } from "react";
import { Coins, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useSale } from "@/hooks/useLaunchpad";

interface ContributeCardProps {
  saleId: number;
  onSuccess?: () => void;
}

export function ContributeCard({ saleId, onSuccess }: ContributeCardProps) {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();

  const {
    sale, baseTokenMeta, userSaleInfo, baseTokenBalance,
    needsApproval, isApproving, isContributing, isConfirming,
    approve, contribute, error,
  } = useSale(saleId, amount);

  const baseDecimals = baseTokenMeta?.decimals ?? 18;
  const baseSymbol = baseTokenMeta?.symbol ?? "tokens";

  const handleMaxClick = () => {
    setAmount(formatUnits(baseTokenBalance, baseDecimals));
  };

  const handleContribute = async () => {
    await contribute(amount);
    setAmount("");
    if (onSuccess) onSuccess();
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (userSaleInfo && !userSaleInfo.canParticipate) return { text: "veNFT Required", disabled: true };
    if (!amount || parseFloat(amount) <= 0) return { text: "Enter Amount", disabled: true };
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 10 ** baseDecimals));
    if (amountBigInt > baseTokenBalance) return { text: "Insufficient Balance", disabled: true };
    if (isApproving) return { text: "Approving...", disabled: true };
    if (needsApproval) return { text: `Approve ${baseSymbol}`, disabled: false, action: "approve" as const };
    if (isContributing || isConfirming) return { text: "Contributing...", disabled: true };
    return { text: "Contribute", disabled: false, action: "contribute" as const };
  }, [isConnected, amount, baseTokenBalance, needsApproval, isApproving, isContributing, isConfirming, userSaleInfo, baseDecimals, baseSymbol]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") await approve();
    else if (buttonState.action === "contribute") await handleContribute();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Contribute
        </CardTitle>
        <CardDescription>
          Commit {baseSymbol} to participate in this sale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* veNFT Warning */}
        {isConnected && userSaleInfo && !userSaleInfo.canParticipate && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-500">veNFT Required</p>
              <p className="text-muted-foreground mt-1">
                You need to hold a vePHASOR NFT to participate. Lock PHASOR tokens on the Lock page to get one.
              </p>
            </div>
          </div>
        )}

        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {parseFloat(formatUnits(baseTokenBalance, baseDecimals)).toFixed(4)} {baseSymbol}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline" onClick={handleMaxClick}>
              MAX
            </Button>
          </div>
        </div>

        {/* Info */}
        {sale && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total for sale</span>
              <span>{parseFloat(formatUnits(sale.tokenAmount, 18)).toFixed(0)} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total raised</span>
              <span>{parseFloat(formatUnits(sale.raised, baseDecimals)).toFixed(4)} {baseSymbol}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price per token</span>
              <span>{parseFloat(formatUnits(sale.price, baseDecimals)).toFixed(6)} {baseSymbol}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          size="lg"
          disabled={buttonState.disabled}
          onClick={handleButtonClick}
        >
          {buttonState.text}
        </Button>
      </CardContent>
    </Card>
  );
}
