import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { Address, erc20Abi, parseUnits } from "viem";
import { VeNFT } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { VOTING_ESCROW_ABI } from "@/config/abis/votingEscrow";

const WEEK = 7 * 24 * 60 * 60;
const MAX_LOCK_TIME = 4 * 365 * 24 * 60 * 60;

export function useVotingEscrow(lockAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!lockAmount) return BigInt(0);
    try {
      return parseUnits(lockAmount, 18);
    } catch {
      return BigInt(0);
    }
  }, [lockAmount]);

  // Total locked PHASOR (Velodrome uses `supply()` instead of `totalLocked()`)
  const { data: totalLocked = BigInt(0) } = useReadContract({
    address: CONTRACTS.VOTING_ESCROW,
    abi: VOTING_ESCROW_ABI,
    functionName: "supply",
    query: { enabled: !!CONTRACTS.VOTING_ESCROW },
  });

  // Total voting power (Velodrome `totalSupply()` returns total ve power)
  const { data: totalVotingPower = BigInt(0) } = useReadContract({
    address: CONTRACTS.VOTING_ESCROW,
    abi: VOTING_ESCROW_ABI,
    functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.VOTING_ESCROW },
  });

  const { data: phasorBalance = BigInt(0) } = useReadContract({
    address: CONTRACTS.PHASOR_TOKEN,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !!CONTRACTS.PHASOR_TOKEN },
  });

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.PHASOR_TOKEN,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && CONTRACTS.VOTING_ESCROW ? [account, CONTRACTS.VOTING_ESCROW] : undefined,
    query: { enabled: !!account && !!CONTRACTS.PHASOR_TOKEN && !!CONTRACTS.VOTING_ESCROW },
  });

  // Velodrome VE: use balanceOf (NFT count) + ownerToNFTokenIdList to get token IDs
  const { data: nftCount = BigInt(0), refetch: refetchNftCount } = useReadContract({
    address: CONTRACTS.VOTING_ESCROW,
    abi: VOTING_ESCROW_ABI,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !!CONTRACTS.VOTING_ESCROW },
  });

  // Build multicall to fetch all token IDs by index
  const tokenIdContracts = useMemo(() => {
    const count = Number(nftCount);
    if (!account || count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: CONTRACTS.VOTING_ESCROW as Address,
      abi: VOTING_ESCROW_ABI,
      functionName: "ownerToNFTokenIdList" as const,
      args: [account, BigInt(i)],
    }));
  }, [account, nftCount]);

  const { data: tokenIdResults, refetch: refetchTokenIdResults } = useReadContracts({
    contracts: tokenIdContracts,
    query: { enabled: tokenIdContracts.length > 0 },
  });

  const tokenIds = useMemo(() => {
    if (!tokenIdResults) return [];
    return tokenIdResults
      .filter((r) => r.status === "success")
      .map((r) => r.result as bigint);
  }, [tokenIdResults]);

  // Fetch lock data, voting power, and voted status for each token ID
  const lockContracts = useMemo(() => {
    if (!tokenIds || tokenIds.length === 0) return [];
    return tokenIds.flatMap((tokenId) => [
      {
        address: CONTRACTS.VOTING_ESCROW as Address,
        abi: VOTING_ESCROW_ABI,
        functionName: "locked" as const,
        args: [tokenId],
      },
      {
        address: CONTRACTS.VOTING_ESCROW as Address,
        abi: VOTING_ESCROW_ABI,
        functionName: "balanceOfNFT" as const,
        args: [tokenId],
      },
      {
        address: CONTRACTS.VOTING_ESCROW as Address,
        abi: VOTING_ESCROW_ABI,
        functionName: "voted" as const,
        args: [tokenId],
      },
    ]);
  }, [tokenIds]);

  const { data: lockData, isLoading, refetch: refetchLocks } = useReadContracts({
    contracts: lockContracts,
    query: { enabled: lockContracts.length > 0 },
  });

  const userVeNFTs = useMemo((): VeNFT[] => {
    if (!tokenIds || !lockData || tokenIds.length === 0) return [];
    const nfts: VeNFT[] = [];
    for (let i = 0; i < tokenIds.length; i++) {
      const lockedResult = lockData[i * 3];
      const votingPowerResult = lockData[i * 3 + 1];
      const votedResult = lockData[i * 3 + 2];
      if (lockedResult?.status === "success" && votingPowerResult?.status === "success") {
        // Velodrome LockedBalance: { int128 amount, uint256 end, bool isPermanent }
        const locked = lockedResult.result as { amount: bigint; end: bigint; isPermanent: boolean };
        // int128 amount may be negative in edge cases; use absolute value
        const amount = locked.amount < BigInt(0) ? -locked.amount : locked.amount;
        nfts.push({
          tokenId: tokenIds[i],
          locked: { amount, end: Number(locked.end), isPermanent: locked.isPermanent },
          votingPower: votingPowerResult.result as bigint,
          voted: votedResult?.status === "success" ? (votedResult.result as boolean) : false,
        });
      }
    }
    return nfts;
  }, [tokenIds, lockData]);

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    return allowance < parsedAmount;
  }, [allowance, parsedAmount]);

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeLock, data: lockHash, isPending: isLockPending, error: lockError } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isLockConfirming, isSuccess: isLockSuccess } = useWaitForTransactionReceipt({ hash: lockHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (lockError) setError(lockError.message); }, [lockError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isLockSuccess) setTimeout(() => { refetchNftCount(); refetchTokenIdResults(); refetchLocks(); }, 500); }, [isLockSuccess, refetchNftCount, refetchTokenIdResults, refetchLocks]);

  const calculateVotingPower = useCallback((amount: string, durationSeconds: number): bigint => {
    try {
      const parsedAmt = parseUnits(amount, 18);
      return (parsedAmt * BigInt(durationSeconds)) / BigInt(MAX_LOCK_TIME);
    } catch { return BigInt(0); }
  }, []);

  const approve = useCallback(async () => {
    if (!account || !CONTRACTS.PHASOR_TOKEN || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeApprove({ address: CONTRACTS.PHASOR_TOKEN, abi: erc20Abi, functionName: "approve", args: [CONTRACTS.VOTING_ESCROW, parsedAmount] });
  }, [account, parsedAmount, writeApprove]);

  // Velodrome createLock takes duration in seconds (not absolute timestamp)
  const createLock = useCallback(async (amount: string, durationSeconds: number) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    const parsedAmt = parseUnits(amount, 18);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "createLock", args: [parsedAmt, BigInt(durationSeconds)] });
  }, [account, writeLock]);

  const increaseAmount = useCallback(async (tokenId: bigint, amount: string) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "increaseAmount", args: [tokenId, parseUnits(amount, 18)] });
  }, [account, writeLock]);

  // Velodrome increaseUnlockTime takes additional duration in seconds
  const increaseUnlockTime = useCallback(async (tokenId: bigint, additionalDurationSeconds: number) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "increaseUnlockTime", args: [tokenId, BigInt(additionalDurationSeconds)] });
  }, [account, writeLock]);

  const withdraw = useCallback(async (tokenId: bigint) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "withdraw", args: [tokenId] });
  }, [account, writeLock]);

  const merge = useCallback(async (fromTokenId: bigint, toTokenId: bigint) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "merge", args: [fromTokenId, toTokenId] });
  }, [account, writeLock]);

  const lockPermanent = useCallback(async (tokenId: bigint) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "lockPermanent", args: [tokenId] });
  }, [account, writeLock]);

  const unlockPermanent = useCallback(async (tokenId: bigint) => {
    if (!account || !CONTRACTS.VOTING_ESCROW) return;
    setError(null);
    writeLock({ address: CONTRACTS.VOTING_ESCROW, abi: VOTING_ESCROW_ABI, functionName: "unlockPermanent", args: [tokenId] });
  }, [account, writeLock]);

  const refetch = useCallback(() => { refetchAllowance(); refetchNftCount(); refetchTokenIdResults(); refetchLocks(); }, [refetchAllowance, refetchNftCount, refetchTokenIdResults, refetchLocks]);

  return {
    userVeNFTs, totalLocked, totalVotingPower, phasorBalance, isLoading,
    createLock, increaseAmount, increaseUnlockTime, withdraw,
    merge, lockPermanent, unlockPermanent,
    needsApproval, isApproving: isApprovePending || isApproveConfirming,
    isLocking: isLockPending, isConfirming: isLockConfirming, isSuccess: isLockSuccess,
    approve, refetch, error, calculateVotingPower,
  };
}

export const LOCK_DURATIONS = {
  ONE_WEEK: WEEK, ONE_MONTH: 30 * 24 * 60 * 60, THREE_MONTHS: 90 * 24 * 60 * 60,
  SIX_MONTHS: 180 * 24 * 60 * 60, ONE_YEAR: 365 * 24 * 60 * 60, FOUR_YEARS: MAX_LOCK_TIME,
};
export { WEEK, MAX_LOCK_TIME };
