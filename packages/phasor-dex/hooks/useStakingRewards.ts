import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { erc20Abi, parseUnits } from "viem";
import { UserStakeInfo, StakingPoolInfo } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { GAUGE_ABI } from "@/config/abis/stakingRewards";

export function useStakingRewards(stakeAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!stakeAmount) return BigInt(0);
    try { return parseUnits(stakeAmount, 18); } catch { return BigInt(0); }
  }, [stakeAmount]);

  // ---- Global pool reads ----

  const { data: stakingToken } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "stakingToken",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: rewardToken } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "rewardToken",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: totalSupply = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: rewardRate = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "rewardRate",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: periodFinish = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "periodFinish",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: duration = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "DURATION",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  const { data: rewardsLeft = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "left",
    query: { enabled: !!CONTRACTS.GAUGE },
  });

  // ---- Per-user reads ----

  const { data: userBalance = BigInt(0), refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "balanceOf",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.GAUGE },
  });

  const { data: pendingRewards = BigInt(0), refetch: refetchRewards } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "earned",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.GAUGE },
  });

  const { data: timeMultiplier = BigInt(1e18) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "getTimeMultiplier",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.GAUGE },
  });

  const { data: firstStakeTime = BigInt(0) } = useReadContract({
    address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "userFirstStakeTime",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.GAUGE },
  });

  // ---- LP token balance & allowance ----

  const { data: lpBalance = BigInt(0) } = useReadContract({
    address: stakingToken, abi: erc20Abi, functionName: "balanceOf",
    args: account ? [account] : undefined, query: { enabled: !!account && !!stakingToken },
  });

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: stakingToken, abi: erc20Abi, functionName: "allowance",
    args: account && CONTRACTS.GAUGE ? [account, CONTRACTS.GAUGE] : undefined,
    query: { enabled: !!account && !!stakingToken && !!CONTRACTS.GAUGE },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    return allowance < parsedAmount;
  }, [allowance, parsedAmount]);

  // ---- Derived state ----

  const poolInfo = useMemo((): StakingPoolInfo | null => {
    if (!stakingToken || !rewardToken) return null;
    return {
      stakingToken, rewardToken, totalSupply, rewardRate,
      periodFinish: Number(periodFinish),
      duration: Number(duration),
      rewardsLeft,
    };
  }, [stakingToken, rewardToken, totalSupply, rewardRate, periodFinish, duration, rewardsLeft]);

  const userStakeInfo = useMemo((): UserStakeInfo | null => {
    if (!account) return null;
    return {
      balance: userBalance,
      timeMultiplier,
      pendingRewards,
      firstStakeTime: Number(firstStakeTime),
    };
  }, [account, userBalance, timeMultiplier, pendingRewards, firstStakeTime]);

  // ---- Write contract hooks ----

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeAction, data: actionHash, isPending: isActionPending, error: actionError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({ hash: actionHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (actionError) setError(actionError.message); }, [actionError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isActionSuccess) setTimeout(() => { refetchBalance(); refetchRewards(); }, 500); }, [isActionSuccess, refetchBalance, refetchRewards]);

  // ---- Actions ----

  const approve = useCallback(async () => {
    if (!account || !stakingToken || !CONTRACTS.GAUGE) return;
    setError(null);
    writeApprove({ address: stakingToken, abi: erc20Abi, functionName: "approve", args: [CONTRACTS.GAUGE, parsedAmount] });
  }, [account, stakingToken, parsedAmount, writeApprove]);

  const stake = useCallback(async (amount: string) => {
    if (!account || !CONTRACTS.GAUGE) return;
    setError(null);
    writeAction({ address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "deposit", args: [parseUnits(amount, 18)] });
  }, [account, writeAction]);

  const unstake = useCallback(async (amount: string) => {
    if (!account || !CONTRACTS.GAUGE) return;
    setError(null);
    writeAction({ address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "withdraw", args: [parseUnits(amount, 18)] });
  }, [account, writeAction]);

  const claimRewards = useCallback(async () => {
    if (!account || !CONTRACTS.GAUGE) return;
    setError(null);
    writeAction({ address: CONTRACTS.GAUGE, abi: GAUGE_ABI, functionName: "getReward", args: [account] });
  }, [account, writeAction]);

  const refetch = useCallback(() => { refetchAllowance(); refetchBalance(); refetchRewards(); }, [refetchAllowance, refetchBalance, refetchRewards]);

  return {
    poolInfo, userStakeInfo, lpBalance, isLoading: false, stake, unstake, claimRewards,
    needsApproval, isApproving: isApprovePending || isApproveConfirming,
    isStaking: isActionPending, isConfirming: isActionConfirming, isSuccess: isActionSuccess,
    approve, refetch, error,
  };
}
