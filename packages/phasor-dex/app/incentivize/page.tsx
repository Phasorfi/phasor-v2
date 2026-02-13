"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Gift, AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "wagmi";
import { Address, formatUnits } from "viem";
import { useVoter } from "@/hooks/useVoter";
import { useIncentivize } from "@/hooks/useIncentivize";

export default function IncentivizePage() {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedPool, setSelectedPool] = useState<string>("");
  const [tokenAddress, setTokenAddress] = useState<string>("");
  const [amount, setAmount] = useState("");
  const { isConnected } = useAccount();
  const { poolVoteInfos } = useVoter();

  const selectedPoolInfo = useMemo(() => {
    return poolVoteInfos.find((p) => p.pool === selectedPool);
  }, [poolVoteInfos, selectedPool]);

  const incentiveAddress = selectedPoolInfo?.incentiveAddress;

  const {
    tokenBalance, needsApproval, isApproving, isDepositing,
    approve, deposit, error,
  } = useIncentivize(
    incentiveAddress,
    tokenAddress ? (tokenAddress as Address) : undefined,
    amount
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const buttonState = useMemo(() => {
    if (!isConnected) return { text: "Connect Wallet", disabled: true };
    if (!selectedPool) return { text: "Select Pool", disabled: true };
    if (!tokenAddress) return { text: "Enter Token Address", disabled: true };
    if (!amount || parseFloat(amount) <= 0) return { text: "Enter Amount", disabled: true };
    if (isApproving) return { text: "Approving...", disabled: true };
    if (needsApproval) return { text: "Approve Token", disabled: false, action: "approve" as const };
    if (isDepositing) return { text: "Depositing...", disabled: true };
    return { text: "Deposit Incentive", disabled: false, action: "deposit" as const };
  }, [isConnected, selectedPool, tokenAddress, amount, needsApproval, isApproving, isDepositing]);

  const handleButtonClick = async () => {
    if (buttonState.action === "approve") await approve();
    else if (buttonState.action === "deposit") {
      await deposit(amount);
      setAmount("");
    }
  };

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Incentivize</h1>
          <p className="text-muted-foreground mt-1">
            Deposit tokens as voting incentives (bribes) for pool gauges
          </p>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p>Incentives are distributed to voters who vote for the selected pool&apos;s gauge during the current epoch.</p>
                <p className="mt-1">Deposited tokens cannot be withdrawn once submitted.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Incentivize Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Deposit Incentive
            </CardTitle>
            <CardDescription>
              Select a pool and deposit tokens as voting incentives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Pool Selector */}
            <div className="space-y-2">
              <Label>Pool</Label>
              <Select value={selectedPool} onValueChange={setSelectedPool}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pool to incentivize" />
                </SelectTrigger>
                <SelectContent>
                  {poolVoteInfos
                    .filter((p) => p.isAlive)
                    .map((pool) => (
                      <SelectItem key={pool.pool} value={pool.pool}>
                        {pool.token0Symbol}/{pool.token1Symbol} ({pool.isStable ? "Stable" : "Volatile"})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Token Address */}
            <div className="space-y-2">
              <Label>Incentive Token Address</Label>
              <Input
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
              {tokenAddress && tokenBalance > BigInt(0) && (
                <p className="text-sm text-muted-foreground">
                  Balance: {parseFloat(formatUnits(tokenBalance, 18)).toFixed(4)}
                </p>
              )}
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="0.0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Submit */}
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
      </div>
    </div>
  );
}
