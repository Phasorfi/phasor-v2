import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { Address, erc20Abi, parseUnits } from "viem";
import { CONTRACTS } from "@/config/chains";

// IncentiveReward contract ABI (notifyRewardAmount pattern)
const INCENTIVE_REWARD_ABI = [
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "notifyRewardAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function useIncentivize(incentiveAddress?: Address, tokenAddress?: Address, depositAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!depositAmount) return BigInt(0);
    try { return parseUnits(depositAmount, 18); } catch { return BigInt(0); }
  }, [depositAmount]);

  // Token balance
  const { data: tokenBalance = BigInt(0) } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !!tokenAddress },
  });

  // Token allowance to incentive contract
  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && incentiveAddress ? [account, incentiveAddress] : undefined,
    query: { enabled: !!account && !!tokenAddress && !!incentiveAddress },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    return allowance < parsedAmount;
  }, [allowance, parsedAmount]);

  // Write hooks
  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeDeposit, data: depositHash, isPending: isDepositPending, error: depositError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (depositError) setError(depositError.message); }, [depositError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);

  const approve = useCallback(async () => {
    if (!account || !tokenAddress || !incentiveAddress) return;
    setError(null);
    writeApprove({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [incentiveAddress, parsedAmount],
    });
  }, [account, tokenAddress, incentiveAddress, parsedAmount, writeApprove]);

  const deposit = useCallback(async (amount: string) => {
    if (!account || !incentiveAddress || !tokenAddress) return;
    setError(null);
    const parsed = parseUnits(amount, 18);
    writeDeposit({
      address: incentiveAddress,
      abi: INCENTIVE_REWARD_ABI,
      functionName: "notifyRewardAmount",
      args: [tokenAddress, parsed],
    });
  }, [account, incentiveAddress, tokenAddress, writeDeposit]);

  return {
    tokenBalance,
    needsApproval,
    isApproving: isApprovePending || isApproveConfirming,
    isDepositing: isDepositPending || isDepositConfirming,
    isDepositSuccess,
    approve,
    deposit,
    error,
  };
}
