"use client";

import React from "react";
import { Gift, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { useSale } from "@/hooks/useLaunchpad";

interface ClaimCardProps {
  saleId: number;
  isRefund?: boolean;
  onSuccess?: () => void;
}

export function ClaimCard({ saleId, isRefund = false, onSuccess }: ClaimCardProps) {
  const { isConnected } = useAccount();
  const {
    sale, tokenMeta, baseTokenMeta, userSaleInfo,
    isContributing, isConfirming, claim, refund, error,
  } = useSale(saleId);

  const hasContribution = userSaleInfo && userSaleInfo.contribution > BigInt(0);
  const baseDecimals = baseTokenMeta?.decimals ?? 18;
  const tokenDecimals = tokenMeta?.decimals ?? 18;

  // Estimate tokens claimable: (contribution / raised) * tokenAmount
  const tokensClaimable = sale && sale.raised > BigInt(0) && userSaleInfo
    ? (userSaleInfo.contribution * sale.tokenAmount) / sale.raised
    : BigInt(0);

  const handleAction = async () => {
    if (isRefund) {
      await refund();
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
            ? "The sale was not successful. Withdraw your contribution."
            : "Claim your allocated tokens from the successful sale."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Connect your wallet to {isRefund ? "withdraw" : "claim"}</p>
          </div>
        ) : !hasContribution ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">You did not participate in this sale</p>
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
                  ? parseFloat(formatUnits(userSaleInfo?.contribution ?? BigInt(0), baseDecimals)).toFixed(4)
                  : parseFloat(formatUnits(tokensClaimable, tokenDecimals)).toFixed(4)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRefund
                  ? (baseTokenMeta?.symbol ?? "tokens")
                  : (tokenMeta?.symbol ?? "tokens")}
              </p>
            </div>

            {/* Stats */}
            <div className="text-sm">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Your Contribution</span>
                <span className="font-medium">
                  {parseFloat(formatUnits(userSaleInfo?.contribution ?? BigInt(0), baseDecimals)).toFixed(4)} {baseTokenMeta?.symbol ?? ""}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {/* Action Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={isContributing || isConfirming}
              onClick={handleAction}
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
