"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Token } from "@/types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TokenSelector } from "@/components/common/TokenSelector";
import { SettingsPopover } from "@/components/common/SettingsPopover";

export function RemoveLiquidityCard() {
  const router = useRouter();
  const { isConnected } = useAccount();

  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);
  const [percentage, setPercentage] = useState(25);
  const [selectorOpen, setSelectorOpen] = useState<"A" | "B" | null>(null);

  const handleSelectToken = (token: Token) => {
    if (selectorOpen === "A") {
      setTokenA(token);
      if (tokenB?.address === token.address) setTokenB(null);
    } else {
      setTokenB(token);
      if (tokenA?.address === token.address) setTokenA(null);
    }
  };

  const presets = [25, 50, 75, 100];

  return (
    <>
      <Card className="w-full max-w-md mx-auto">
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

          <div className="space-y-6">
          {/* Token Selection */}
          <div className="space-y-3">
            <label className="text-sm text-muted-foreground">Select pair</label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectorOpen("A")}
                className="flex-1 justify-between h-12"
              >
                {tokenA ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center">
                      <span className="text-xs font-bold text-phasor-500">
                        {tokenA.symbol.charAt(0)}
                      </span>
                    </div>
                    <span>{tokenA.symbol}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select token</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => setSelectorOpen("B")}
                className="flex-1 justify-between h-12"
              >
                {tokenB ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center">
                      <span className="text-xs font-bold text-phasor-500">
                        {tokenB.symbol.charAt(0)}
                      </span>
                    </div>
                    <span>{tokenB.symbol}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">Select token</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Amount */}
          <div className="p-4 rounded-2xl bg-surface-3 space-y-4">
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
          {tokenA && tokenB && (
            <div className="p-4 rounded-xl bg-surface-3/50 space-y-3">
              <h4 className="text-sm text-muted-foreground">You will receive</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center">
                      <span className="text-xs font-bold text-phasor-500">
                        {tokenA.symbol.charAt(0)}
                      </span>
                    </div>
                    <span>{tokenA.symbol}</span>
                  </div>
                  <span className="font-medium">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-4 flex items-center justify-center">
                      <span className="text-xs font-bold text-phasor-500">
                        {tokenB.symbol.charAt(0)}
                      </span>
                    </div>
                    <span>{tokenB.symbol}</span>
                  </div>
                  <span className="font-medium">--</span>
                </div>
              </div>
            </div>
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
          ) : !tokenA || !tokenB ? (
            <Button size="lg" className="w-full" disabled>
              Select pair
            </Button>
          ) : (
            <Button size="lg" className="w-full" disabled>
              No position found
            </Button>
          )}
          </div>
        </CardContent>
      </Card>

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
