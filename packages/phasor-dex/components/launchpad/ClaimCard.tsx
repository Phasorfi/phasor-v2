"use client";

import React from "react";
import { Gift, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { Address, formatUnits } from "viem";
import { useFairLaunch } from "@/hooks/useLaunchpad";

interface ClaimCardProps {
  launchAddress: Address;
  isRefund?: boolean;
  onSuccess?: () => void;
}

export function ClaimCard({ launchAddress, isRefund = false, onSuccess }: ClaimCardProps) {
  const { isConnected } = useAccount();
  const {
    userLaunchInfo, claim, withdraw, isContributing, isConfirming, error,
  } = useFairLaunch(launchAddress);

  const hasCommitment = userLaunchInfo && userLaunchInfo.commitment > BigInt(0);
  const hasClaimed = userLaunchInfo ? userLaunchInfo.claimed > BigInt(0) : false;

  const handleClaim = async () => {
    // In MISO, withdrawTokens handles both claim and refund
    if (isRefund) {
      await withdraw();
    } else {
      await claim();
    }
    if (onSuccess) onSuccess();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isRefund ? (
            <>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Withdraw Refund
            </>
          ) : (
            <>
              <Gift className="h-5 w-5" />
              Claim Tokens
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isRefund
            ? "The auction was not successful. Withdraw your contribution."
            : "Claim your allocated tokens from the successful auction."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect your wallet to claim</p>
          </div>
        ) : !hasCommitment ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">You did not participate in this auction</p>
          </div>
        ) : hasClaimed ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="font-medium">Already Claimed</p>
            <p className="text-sm text-muted-foreground mt-2">
              You have already claimed your {isRefund ? "refund" : "tokens"}
            </p>
          </div>
        ) : (
          <>
            {/* Claim Info */}
            <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                {isRefund ? "Refund Amount" : "Tokens Claimable"}
              </p>
              <p className="text-4xl font-bold">
                {isRefund
                  ? parseFloat(formatUnits(userLaunchInfo?.commitment ?? BigInt(0), 18)).toFixed(4)
                  : parseFloat(formatUnits(userLaunchInfo?.tokensClaimable ?? BigInt(0), 18)).toFixed(4)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRefund ? "MON" : "tokens"}
              </p>
            </div>

            {/* Stats */}
            <div className="text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Your Commitment</span>
                <span className="font-medium">
                  {parseFloat(formatUnits(userLaunchInfo?.commitment ?? BigInt(0), 18)).toFixed(4)}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Claim Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={isContributing || isConfirming}
              onClick={handleClaim}
            >
              {isContributing || isConfirming
                ? isRefund ? "Withdrawing..." : "Claiming..."
                : isRefund ? "Withdraw Refund" : "Claim Tokens"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
