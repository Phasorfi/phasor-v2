"use client";

import React, { useState, useMemo } from "react";
import { Coins } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount, useBalance } from "wagmi";
import { Address, formatUnits } from "viem";
import { useFairLaunch } from "@/hooks/useLaunchpad";

interface ContributeCardProps {
  launchAddress: Address;
  onSuccess?: () => void;
}

export function ContributeCard({ launchAddress, onSuccess }: ContributeCardProps) {
  const [amount, setAmount] = useState("");
  const { address: account, isConnected } = useAccount();
  const { data: ethBalance } = useBalance({ address: account });

  const {
    launchInfo, needsApproval, isApproving, isContributing, isConfirming,
    approve, contribute, error,
  } = useFairLaunch(launchAddress, amount);

  const isETHSale = !launchInfo?.auctionInfo.paymentCurrency ||
    launchInfo.auctionInfo.paymentCurrency === "0x0000000000000000000000000000000000000000";

  const balance = ethBalance?.value ?? BigInt(0);

  const handleMaxClick = () => {
    setAmount(formatUnits(balance, 18));
  };

  const handleContribute = async () => {
    await contribute(amount);
    setAmount("");
    if (onSuccess) onSuccess();
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (!amount || parseFloat(amount) <= 0) return { text: "Enter Amount", disabled: true };
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18));
    if (amountBigInt > balance) return { text: "Insufficient Balance", disabled: true };
    if (!isETHSale) {
      if (isApproving) return { text: "Approving...", disabled: true };
      if (needsApproval) return { text: "Approve", disabled: false, action: "approve" as const };
    }
    if (isContributing || isConfirming) return { text: "Contributing...", disabled: true };
    return { text: "Contribute", disabled: false, action: "contribute" as const };
  }, [isConnected, amount, balance, needsApproval, isApproving, isContributing, isConfirming, isETHSale]);

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
          Commit {isETHSale ? "MON" : "tokens"} to participate in this auction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {parseFloat(formatUnits(balance, 18)).toFixed(4)} {isETHSale ? "MON" : "tokens"}
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
        {launchInfo && (
          <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total for sale</span>
              <span>{parseFloat(formatUnits(launchInfo.auctionInfo.totalTokens, 18)).toFixed(0)} tokens</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total committed</span>
              <span>{parseFloat(formatUnits(launchInfo.auctionStatus.commitmentsTotal, 18)).toFixed(4)}</span>
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
