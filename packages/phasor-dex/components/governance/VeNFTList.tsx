"use client";

import React, { useState } from "react";
import { Lock, Clock, Zap, AlertCircle, Merge, LockKeyhole, Unlock, Plus, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { VeNFT } from "@/types";
import { useVotingEscrow, LOCK_DURATIONS } from "@/hooks/useVotingEscrow";

interface VeNFTListProps {
  veNFTs: VeNFT[];
  isLoading: boolean;
  onRefresh?: () => void;
}

type DialogType = "increaseAmount" | "extendLock" | "merge" | "makePermanent" | "unlockPermanent" | null;

function VeNFTCard({ veNFT, allNFTs, onRefresh }: { veNFT: VeNFT; allNFTs: VeNFT[]; onRefresh?: () => void }) {
  const {
    withdraw, increaseAmount, increaseUnlockTime, merge, lockPermanent, unlockPermanent,
    needsApproval, approve, isApproving, isLocking, isConfirming, error, phasorBalance,
  } = useVotingEscrow();

  const [activeDialog, setActiveDialog] = useState<DialogType>(null);
  const [inputAmount, setInputAmount] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");

  const now = Math.floor(Date.now() / 1000);
  const isExpired = !veNFT.locked.isPermanent && veNFT.locked.end <= now;
  const timeRemaining = veNFT.locked.isPermanent ? Infinity : veNFT.locked.end - now;

  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Expired";
    const days = Math.floor(seconds / 86400);
    if (days >= 365) return `${Math.floor(days / 365)}y ${Math.floor((days % 365) / 30)}m`;
    if (days >= 30) return `${Math.floor(days / 30)}m ${days % 30}d`;
    if (days >= 1) return `${days}d`;
    const hours = Math.floor(seconds / 3600);
    return `${hours}h`;
  };

  const closeDialog = () => {
    setActiveDialog(null);
    setInputAmount("");
    setSelectedDuration("");
    setMergeTargetId("");
  };

  const handleAction = async (action: () => Promise<void>) => {
    await action();
    closeDialog();
    if (onRefresh) setTimeout(onRefresh, 1000);
  };

  const handleWithdraw = () => handleAction(() => withdraw(veNFT.tokenId));
  const handleIncreaseAmount = () => handleAction(() => increaseAmount(veNFT.tokenId, inputAmount));
  const handleExtendLock = () => handleAction(() => increaseUnlockTime(veNFT.tokenId, Number(selectedDuration)));
  const handleMerge = () => handleAction(() => merge(veNFT.tokenId, BigInt(mergeTargetId)));
  const handleMakePermanent = () => handleAction(() => lockPermanent(veNFT.tokenId));
  const handleUnlockPermanent = () => handleAction(() => unlockPermanent(veNFT.tokenId));

  // Other NFTs available as merge targets
  const mergeTargets = allNFTs.filter((n) => n.tokenId !== veNFT.tokenId);

  return (
    <>
      <Card className={isExpired ? "border-amber-500/50" : ""}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Lock #{veNFT.tokenId.toString()}</CardTitle>
            <div className="flex items-center gap-2">
              {veNFT.voted && (
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Voted</Badge>
              )}
              <Badge variant={isExpired ? "destructive" : veNFT.locked.isPermanent ? "default" : "secondary"}>
                {isExpired ? "Expired" : veNFT.locked.isPermanent ? "Permanent" : formatTimeRemaining(timeRemaining)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" /> Locked
              </p>
              <p className="font-medium">
                {parseFloat(formatUnits(veNFT.locked.amount, 18)).toFixed(2)} PHASOR
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Zap className="h-3 w-3" /> Voting Power
              </p>
              <p className="font-medium">
                {parseFloat(formatUnits(veNFT.votingPower, 18)).toFixed(2)} vePHASOR
              </p>
            </div>
            <div className="col-span-2 space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Unlock Date
              </p>
              <p className="font-medium text-sm">
                {veNFT.locked.isPermanent ? "Permanent (no expiry)" : new Date(veNFT.locked.end * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {/* Increase Amount - available when not expired */}
            {!isExpired && (
              <Button variant="outline" size="sm" onClick={() => setActiveDialog("increaseAmount")}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            )}

            {/* Extend Lock - available when not expired and not permanent */}
            {!isExpired && !veNFT.locked.isPermanent && (
              <Button variant="outline" size="sm" onClick={() => setActiveDialog("extendLock")}>
                <Timer className="h-3 w-3 mr-1" /> Extend
              </Button>
            )}

            {/* Merge - available when 2+ NFTs and not voted */}
            {mergeTargets.length > 0 && !veNFT.voted && (
              <Button variant="outline" size="sm" onClick={() => setActiveDialog("merge")}>
                <Merge className="h-3 w-3 mr-1" /> Merge
              </Button>
            )}

            {/* Make Permanent - available when not permanent */}
            {!veNFT.locked.isPermanent && !isExpired && (
              <Button variant="outline" size="sm" onClick={() => setActiveDialog("makePermanent")}>
                <LockKeyhole className="h-3 w-3 mr-1" /> Permanent
              </Button>
            )}

            {/* Unlock Permanent - available when permanent and not voted */}
            {veNFT.locked.isPermanent && !veNFT.voted && (
              <Button variant="outline" size="sm" onClick={() => setActiveDialog("unlockPermanent")}>
                <Unlock className="h-3 w-3 mr-1" /> Unlock
              </Button>
            )}

            {/* Withdraw - available when expired and not voted */}
            {isExpired && !veNFT.locked.isPermanent && !veNFT.voted && (
              <Button
                variant="outline"
                size="sm"
                disabled={isLocking || isConfirming}
                onClick={handleWithdraw}
              >
                {isLocking || isConfirming ? "Withdrawing..." : "Withdraw"}
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> {error}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Increase Amount Dialog */}
      <Dialog open={activeDialog === "increaseAmount"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Increase Lock Amount</DialogTitle>
            <DialogDescription>Add more PHASOR to Lock #{veNFT.tokenId.toString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Amount</Label>
                <span className="text-sm text-muted-foreground">
                  Balance: {parseFloat(formatUnits(phasorBalance, 18)).toFixed(2)} PHASOR
                </span>
              </div>
              <Input
                type="number"
                placeholder="0.0"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={!inputAmount || parseFloat(inputAmount) <= 0 || isLocking || isConfirming}
              onClick={handleIncreaseAmount}
            >
              {isLocking || isConfirming ? "Confirming..." : "Increase Amount"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Lock Dialog */}
      <Dialog open={activeDialog === "extendLock"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Lock Duration</DialogTitle>
            <DialogDescription>Extend the lock period for Lock #{veNFT.tokenId.toString()}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Additional Duration</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={String(LOCK_DURATIONS.ONE_WEEK)}>1 Week</SelectItem>
                  <SelectItem value={String(LOCK_DURATIONS.ONE_MONTH)}>1 Month</SelectItem>
                  <SelectItem value={String(LOCK_DURATIONS.THREE_MONTHS)}>3 Months</SelectItem>
                  <SelectItem value={String(LOCK_DURATIONS.SIX_MONTHS)}>6 Months</SelectItem>
                  <SelectItem value={String(LOCK_DURATIONS.ONE_YEAR)}>1 Year</SelectItem>
                  <SelectItem value={String(LOCK_DURATIONS.FOUR_YEARS)}>4 Years (Max)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={!selectedDuration || isLocking || isConfirming}
              onClick={handleExtendLock}
            >
              {isLocking || isConfirming ? "Confirming..." : "Extend Lock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={activeDialog === "merge"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Merge Lock</DialogTitle>
            <DialogDescription>
              Merge Lock #{veNFT.tokenId.toString()} into another lock. This will burn the current NFT.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Merge into</Label>
              <Select value={mergeTargetId} onValueChange={setMergeTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target lock" />
                </SelectTrigger>
                <SelectContent>
                  {mergeTargets.map((nft) => (
                    <SelectItem key={nft.tokenId.toString()} value={nft.tokenId.toString()}>
                      Lock #{nft.tokenId.toString()} ({parseFloat(formatUnits(nft.locked.amount, 18)).toFixed(2)} PHASOR)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={!mergeTargetId || isLocking || isConfirming}
              onClick={handleMerge}
            >
              {isLocking || isConfirming ? "Confirming..." : "Merge Locks"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Make Permanent Dialog */}
      <Dialog open={activeDialog === "makePermanent"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Make Lock Permanent</DialogTitle>
            <DialogDescription>
              Lock #{veNFT.tokenId.toString()} will be locked permanently with maximum voting power. You can unlock it later if the lock is not actively voted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={isLocking || isConfirming}
              onClick={handleMakePermanent}
            >
              {isLocking || isConfirming ? "Confirming..." : "Make Permanent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock Permanent Dialog */}
      <Dialog open={activeDialog === "unlockPermanent"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock Permanent Lock</DialogTitle>
            <DialogDescription>
              Remove the permanent status from Lock #{veNFT.tokenId.toString()}. The lock will revert to a time-based expiry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              disabled={isLocking || isConfirming}
              onClick={handleUnlockPermanent}
            >
              {isLocking || isConfirming ? "Confirming..." : "Unlock Permanent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function VeNFTList({ veNFTs, isLoading, onRefresh }: VeNFTListProps) {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Connect your wallet to view your locks</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (veNFTs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">You don&apos;t have any locked PHASOR</p>
          <p className="text-sm text-muted-foreground">
            Lock PHASOR to receive vePHASOR voting power and boost your staking rewards
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {veNFTs.map((veNFT) => (
        <VeNFTCard key={veNFT.tokenId.toString()} veNFT={veNFT} allNFTs={veNFTs} onRefresh={onRefresh} />
      ))}
    </div>
  );
}
