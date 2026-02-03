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
import { STAKING_REWARDS_ABI } from "@/config/abis/stakingRewards";

export function useStakingRewards(stakeAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!stakeAmount) return BigInt(0);
    try { return parseUnits(stakeAmount, 18); } catch { return BigInt(0); }
  }, [stakeAmount]);

  const { data: stakingToken } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "stakingToken",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: rewardsToken } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "rewardsToken",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: totalSupply = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "totalSupply",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: totalEffectiveSupply = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "totalEffectiveSupply",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: rewardRate = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "rewardRate",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: periodFinish = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "periodFinish",
    query: { enabled: !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: userBalance = BigInt(0), refetch: refetchBalance } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "balanceOf",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: effectiveBalance = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "effectiveBalanceOf",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: pendingRewards = BigInt(0), refetch: refetchRewards } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "earned",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: timeMultiplier = BigInt(1e18) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "getTimeMultiplier",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: veBoost = BigInt(1e18) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "getVeBoost",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: totalMultiplier = BigInt(1e18) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "getTotalMultiplier",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: userVeTokenId = BigInt(0) } = useReadContract({
    address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "userVeTokenId",
    args: account ? [account] : undefined, query: { enabled: !!account && !!CONTRACTS.STAKING_REWARDS },
  });

  const { data: lpBalance = BigInt(0) } = useReadContract({
    address: stakingToken, abi: erc20Abi, functionName: "balanceOf",
    args: account ? [account] : undefined, query: { enabled: !!account && !!stakingToken },
  });

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: stakingToken, abi: erc20Abi, functionName: "allowance",
    args: account && CONTRACTS.STAKING_REWARDS ? [account, CONTRACTS.STAKING_REWARDS] : undefined,
    query: { enabled: !!account && !!stakingToken && !!CONTRACTS.STAKING_REWARDS },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    return allowance < parsedAmount;
  }, [allowance, parsedAmount]);

  const poolInfo = useMemo((): StakingPoolInfo | null => {
    if (!stakingToken || !rewardsToken) return null;
    return { stakingToken, rewardsToken, totalSupply, totalEffectiveSupply, rewardRate, periodFinish: Number(periodFinish), rewardsDuration: 7 * 24 * 60 * 60 };
  }, [stakingToken, rewardsToken, totalSupply, totalEffectiveSupply, rewardRate, periodFinish]);

  const userStakeInfo = useMemo((): UserStakeInfo | null => {
    if (!account) return null;
    return { balance: userBalance, effectiveBalance, deposits: [], timeMultiplier, veBoost, totalMultiplier, pendingRewards, veTokenId: userVeTokenId };
  }, [account, userBalance, effectiveBalance, timeMultiplier, veBoost, totalMultiplier, pendingRewards, userVeTokenId]);

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeStake, data: stakeHash, isPending: isStakePending, error: stakeError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isStakeConfirming, isSuccess: isStakeSuccess } = useWaitForTransactionReceipt({ hash: stakeHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (stakeError) setError(stakeError.message); }, [stakeError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isStakeSuccess) setTimeout(() => { refetchBalance(); refetchRewards(); }, 500); }, [isStakeSuccess, refetchBalance, refetchRewards]);

  const approve = useCallback(async () => {
    if (!account || !stakingToken || !CONTRACTS.STAKING_REWARDS) return;
    setError(null);
    writeApprove({ address: stakingToken, abi: erc20Abi, functionName: "approve", args: [CONTRACTS.STAKING_REWARDS, parsedAmount] });
  }, [account, stakingToken, parsedAmount, writeApprove]);

  const stake = useCallback(async (amount: string, veTokenId: bigint = BigInt(0)) => {
    if (!account || !CONTRACTS.STAKING_REWARDS) return;
    setError(null);
    writeStake({ address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "stake", args: [parseUnits(amount, 18), veTokenId] });
  }, [account, writeStake]);

  const unstake = useCallback(async (amount: string) => {
    if (!account || !CONTRACTS.STAKING_REWARDS) return;
    setError(null);
    writeStake({ address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "withdraw", args: [parseUnits(amount, 18)] });
  }, [account, writeStake]);

  const claimRewards = useCallback(async () => {
    if (!account || !CONTRACTS.STAKING_REWARDS) return;
    setError(null);
    writeStake({ address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "getReward", args: [] });
  }, [account, writeStake]);

  const exit = useCallback(async () => {
    if (!account || !CONTRACTS.STAKING_REWARDS) return;
    setError(null);
    writeStake({ address: CONTRACTS.STAKING_REWARDS, abi: STAKING_REWARDS_ABI, functionName: "exit", args: [] });
  }, [account, writeStake]);

  const refetch = useCallback(() => { refetchAllowance(); refetchBalance(); refetchRewards(); }, [refetchAllowance, refetchBalance, refetchRewards]);

  return {
    poolInfo, userStakeInfo, lpBalance, isLoading: false, stake, unstake, claimRewards, exit,
    needsApproval, isApproving: isApprovePending || isApproveConfirming,
    isStaking: isStakePending, isConfirming: isStakeConfirming, isSuccess: isStakeSuccess,
    approve, refetch, error,
  };
}
