"use client";

import React from "react";
import { Settings, Info } from "lucide-react";
import { useSettingsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DEFAULT_SLIPPAGE = 50; // 0.5% in bps

export function SettingsPopover() {
  const {
    slippageTolerance,
    deadline,
    setSlippageTolerance,
    setDeadline,
  } = useSettingsStore();

  const [isAutoSlippage, setIsAutoSlippage] = React.useState(slippageTolerance === DEFAULT_SLIPPAGE);
  const [customSlippage, setCustomSlippage] = React.useState("");

  const handleAutoSlippage = () => {
    if (!isAutoSlippage) {
      setSlippageTolerance(DEFAULT_SLIPPAGE);
      setIsAutoSlippage(true);
      setCustomSlippage("");
    }
  };

  const handleInputFocus = () => {
    setIsAutoSlippage(false);
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 50) {
      setSlippageTolerance(Math.round(parsed * 100)); // Convert % to bps
      setIsAutoSlippage(false);
    }
  };

  const displaySlippage = slippageTolerance / 100;

  return (
    <TooltipProvider>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-muted rounded-xl"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 bg-card border-border" align="end">
          <div className="space-y-6">
            <h4 className="font-medium text-foreground">Transaction Settings</h4>

            {/* Slippage Tolerance */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Slippage Tolerance
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Maximum price difference you're willing to accept between when you submit a transaction and when it's executed. Higher slippage may increase the chance of success but could result in worse rates.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAutoSlippage ? "secondary" : "outline"}
                    size="sm"
                    onClick={handleAutoSlippage}
                    className="h-8 text-xs"
                  >
                    Auto
                  </Button>
                  <div className="relative w-24">
                    <Input
                      type="number"
                      placeholder="0.50"
                      value={isAutoSlippage ? "" : customSlippage || displaySlippage}
                      onChange={(e) => handleCustomSlippage(e.target.value)}
                      onFocus={handleInputFocus}
                      className={cn(
                        "pr-8 h-8 text-xs cursor-pointer",
                        !isAutoSlippage && "border-primary/50"
                      )}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                      %
                    </span>
                  </div>
                </div>
              </div>
              {slippageTolerance > 100 && (
                <p className="text-xs text-yellow-500">
                  High slippage tolerance. Your transaction may be frontrun.
                </p>
              )}
            </div>

            {/* Transaction Deadline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">
                    Transaction Deadline
                  </label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Your transaction will revert if it's pending for longer than this duration. Helps protect against price changes and stuck transactions.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="relative w-24">
                  <Input
                    type="number"
                    value={deadline}
                    onChange={(e) => setDeadline(Number(e.target.value))}
                    className="pr-12 h-8 text-xs"
                    min={1}
                    max={60}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
