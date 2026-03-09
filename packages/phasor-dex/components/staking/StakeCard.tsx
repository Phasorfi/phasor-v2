"use client";

import React, { useState, useMemo } from "react";
import { Coins, ArrowDownUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useStakingRewards } from "@/hooks/useStakingRewards";

interface StakeCardProps {
  mode: "stake" | "unstake";
  onSuccess?: () => void;
}

export function StakeCard({ mode, onSuccess }: StakeCardProps) {
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();

  const {
    lpBalance, userStakeInfo, needsApproval, isApproving, isStaking, isConfirming,
    approve, stake, unstake, error,
  } = useStakingRewards(amount);

  const maxAmount = mode === "stake" ? lpBalance : (userStakeInfo?.balance ?? BigInt(0));

  const handleMaxClick = () => {
    setAmount(formatUnits(maxAmount, 18));
  };

  const handleAction = async () => {
    if (mode === "stake") {
      await stake(amount);
    } else {
      await unstake(amount);
    }
    setAmount("");
    if (onSuccess) onSuccess();
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (!amount || parseFloat(amount) <= 0) return { text: "Enter Amount", disabled: true };
    const amountBigInt = BigInt(Math.floor(parseFloat(amount) * 1e18));
    if (amountBigInt > maxAmount) return { text: "Insufficient Balance", disabled: true };
    if (mode === "stake") {
      if (isApproving) return { text: "Approving...", disabled: true };
      if (needsApproval) return { text: "Approve LP Token", disabled: false, action: "approve" };
    }
    if (isStaking || isConfirming) return { text: mode === "stake" ? "Staking..." : "Unstaking...", disabled: true };
    return { text: mode === "stake" ? "Stake" : "Unstake", disabled: false, action: mode };
  }, [isConnected, amount, maxAmount, needsApproval, isApproving, isStaking, isConfirming, mode]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") await approve();
    else if (buttonState.action === "stake" || buttonState.action === "unstake") await handleAction();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {mode === "stake" ? <Coins className="h-5 w-5" /> : <ArrowDownUp className="h-5 w-5" />}
          {mode === "stake" ? "Stake LP Tokens" : "Unstake LP Tokens"}
        </CardTitle>
        <CardDescription>
          {mode === "stake"
            ? "Stake your LP tokens to earn PHASOR rewards"
            : "Withdraw your staked LP tokens"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            <span className="text-sm text-muted-foreground">
              {mode === "stake" ? "Balance" : "Staked"}: {parseFloat(formatUnits(maxAmount, 18)).toFixed(4)} LP
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
