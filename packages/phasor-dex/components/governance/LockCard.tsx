"use client";

import React, { useState, useMemo } from "react";
import { Lock, Clock, Zap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useVotingEscrow, LOCK_DURATIONS, MAX_LOCK_TIME } from "@/hooks/useVotingEscrow";

interface LockCardProps {
  onSuccess?: () => void;
}

const DURATION_OPTIONS = [
  { label: "1 Week", value: LOCK_DURATIONS.ONE_WEEK },
  { label: "1 Month", value: LOCK_DURATIONS.ONE_MONTH },
  { label: "3 Months", value: LOCK_DURATIONS.THREE_MONTHS },
  { label: "6 Months", value: LOCK_DURATIONS.SIX_MONTHS },
  { label: "1 Year", value: LOCK_DURATIONS.ONE_YEAR },
  { label: "4 Years", value: LOCK_DURATIONS.FOUR_YEARS },
];

export function LockCard({ onSuccess }: LockCardProps) {
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(LOCK_DURATIONS.ONE_YEAR);
  const { isConnected } = useAccount();

  const {
    phasorBalance, needsApproval, isApproving, isLocking, isConfirming, isSuccess,
    approve, createLock, calculateVotingPower, error,
  } = useVotingEscrow(amount);

  const votingPowerPreview = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return BigInt(0);
    return calculateVotingPower(amount, duration);
  }, [amount, duration, calculateVotingPower]);

  const handleMaxClick = () => {
    setAmount(formatUnits(phasorBalance, 18));
  };

  const handleLock = async () => {
    await createLock(amount, duration);
    if (onSuccess) onSuccess();
  };

  const formatDuration = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    if (days >= 365) return `${Math.floor(days / 365)} year${days >= 730 ? "s" : ""}`;
    if (days >= 30) return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""}`;
    if (days >= 7) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""}`;
    return `${days} day${days !== 1 ? "s" : ""}`;
  };

  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (!amount || parseFloat(amount) <= 0) return { text: "Enter Amount", disabled: true };
    if (phasorBalance < BigInt(Math.floor(parseFloat(amount) * 1e18))) return { text: "Insufficient Balance", disabled: true };
    if (isApproving) return { text: "Approving...", disabled: true };
    if (needsApproval) return { text: "Approve PHASOR", disabled: false, action: "approve" };
    if (isLocking || isConfirming) return { text: "Locking...", disabled: true };
    return { text: "Lock PHASOR", disabled: false, action: "lock" };
  }, [isConnected, amount, phasorBalance, needsApproval, isApproving, isLocking, isConfirming]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") await approve();
    else if (buttonState.action === "lock") await handleLock();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Lock PHASOR
        </CardTitle>
        <CardDescription>
          Lock your PHASOR tokens to receive vePHASOR voting power. Longer locks = more voting power.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Amount</Label>
            <span className="text-sm text-muted-foreground">
              Balance: {formatUnits(phasorBalance, 18).slice(0, 10)} PHASOR
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

        {/* Duration Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Lock Duration
            </Label>
            <span className="text-sm font-medium">{formatDuration(duration)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Button
                key={opt.value}
                variant={duration === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setDuration(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Voting Power Preview */}
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Voting Power
            </span>
            <span className="font-medium">
              {parseFloat(formatUnits(votingPowerPreview, 18)).toFixed(4)} vePHASOR
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Unlock Date</span>
            <span className="font-medium">
              {new Date(Date.now() + duration * 1000).toLocaleDateString()}
            </span>
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
