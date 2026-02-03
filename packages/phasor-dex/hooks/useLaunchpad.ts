import { useState, useMemo, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Address, erc20Abi, parseUnits } from "viem";
import { LaunchInfo, SaleInfo, SaleStatus, LaunchState, UserLaunchInfo } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { LAUNCHPAD_FACTORY_ABI } from "@/config/abis/launchpadFactory";
import { FAIR_LAUNCH_ABI } from "@/config/abis/fairLaunch";

export function useLaunchpad() {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const { data: launchAddresses = [], refetch: refetchLaunches, isLoading } = useReadContract({
    address: CONTRACTS.LAUNCHPAD_FACTORY, abi: LAUNCHPAD_FACTORY_ABI, functionName: "getAllLaunches",
    query: { enabled: !!CONTRACTS.LAUNCHPAD_FACTORY },
  });

  const { data: launchCount = BigInt(0) } = useReadContract({
    address: CONTRACTS.LAUNCHPAD_FACTORY, abi: LAUNCHPAD_FACTORY_ABI, functionName: "launchCount",
    query: { enabled: !!CONTRACTS.LAUNCHPAD_FACTORY },
  });

  return { launchAddresses: launchAddresses as Address[], launchCount: Number(launchCount), isLoading, refetch: refetchLaunches, error };
}

export function useFairLaunch(launchAddress: Address | null, contributeAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!contributeAmount) return BigInt(0);
    try { return parseUnits(contributeAmount, 18); } catch { return BigInt(0); }
  }, [contributeAmount]);

  const { data: saleInfo, refetch: refetchSaleInfo } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "saleInfo",
    query: { enabled: !!launchAddress },
  });

  const { data: saleStatus, refetch: refetchSaleStatus } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "saleStatus",
    query: { enabled: !!launchAddress },
  });

  const { data: creator } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "creator",
    query: { enabled: !!launchAddress },
  });

  const { data: liquidityBps = BigInt(0) } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "liquidityBps",
    query: { enabled: !!launchAddress },
  });

  const { data: tokensForLiquidity = BigInt(0) } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "tokensForLiquidity",
    query: { enabled: !!launchAddress },
  });

  const { data: isActive = false } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "isActive",
    query: { enabled: !!launchAddress },
  });

  const { data: softCapReached = false } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "softCapReached",
    query: { enabled: !!launchAddress },
  });

  const { data: userCommitment = BigInt(0), refetch: refetchCommitment } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "commitments",
    args: account ? [account] : undefined, query: { enabled: !!launchAddress && !!account },
  });

  const { data: userAllocation = BigInt(0) } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "getAllocation",
    args: account ? [account] : undefined, query: { enabled: !!launchAddress && !!account },
  });

  const { data: userClaimed = false } = useReadContract({
    address: launchAddress as Address, abi: FAIR_LAUNCH_ABI, functionName: "claimed",
    args: account ? [account] : undefined, query: { enabled: !!launchAddress && !!account },
  });

  const { data: paymentAllowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: saleInfo?.paymentToken as Address, abi: erc20Abi, functionName: "allowance",
    args: account && launchAddress ? [account, launchAddress] : undefined,
    query: { enabled: !!account && !!launchAddress && !!saleInfo?.paymentToken && saleInfo.paymentToken !== "0x0000000000000000000000000000000000000000" },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    if (!saleInfo?.paymentToken || saleInfo.paymentToken === "0x0000000000000000000000000000000000000000") return false;
    return paymentAllowance < parsedAmount;
  }, [paymentAllowance, parsedAmount, saleInfo?.paymentToken]);

  const launchState = useMemo((): LaunchState => {
    if (!saleInfo || !saleStatus) return "pending";
    const now = Math.floor(Date.now() / 1000);
    if (saleStatus.cancelled) return "cancelled";
    if (saleStatus.finalized) return "finalized";
    if (now < Number(saleInfo.startTime)) return "pending";
    if (now <= Number(saleInfo.endTime)) return "active";
    if (softCapReached) return "success";
    return "failed";
  }, [saleInfo, saleStatus, softCapReached]);

  const launchInfo = useMemo((): LaunchInfo | null => {
    if (!launchAddress || !saleInfo || !saleStatus || !creator) return null;
    return {
      address: launchAddress, creator: creator as Address,
      saleInfo: { saleToken: saleInfo.saleToken, paymentToken: saleInfo.paymentToken, totalTokens: saleInfo.totalTokens,
        startTime: Number(saleInfo.startTime), endTime: Number(saleInfo.endTime), softCap: saleInfo.softCap,
        hardCap: saleInfo.hardCap, vestingDuration: Number(saleInfo.vestingDuration), vestingCliff: Number(saleInfo.vestingCliff) },
      saleStatus: { totalRaised: saleStatus.totalRaised, totalParticipants: Number(saleStatus.totalParticipants),
        finalized: saleStatus.finalized, cancelled: saleStatus.cancelled },
      liquidityBps: Number(liquidityBps), tokensForLiquidity, state: launchState,
    };
  }, [launchAddress, saleInfo, saleStatus, creator, liquidityBps, tokensForLiquidity, launchState]);

  const userLaunchInfo = useMemo((): UserLaunchInfo | null => {
    if (!account) return null;
    return { commitment: userCommitment, allocation: userAllocation, claimed: userClaimed, vestingWallet: null };
  }, [account, userCommitment, userAllocation, userClaimed]);

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeLaunch, data: launchHash, isPending: isLaunchPending, error: launchError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isLaunchConfirming, isSuccess: isLaunchSuccess } = useWaitForTransactionReceipt({ hash: launchHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (launchError) setError(launchError.message); }, [launchError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isLaunchSuccess) setTimeout(() => { refetchSaleStatus(); refetchCommitment(); }, 500); }, [isLaunchSuccess, refetchSaleStatus, refetchCommitment]);

  const approve = useCallback(async () => {
    if (!account || !launchAddress || !saleInfo?.paymentToken) return;
    setError(null);
    writeApprove({ address: saleInfo.paymentToken, abi: erc20Abi, functionName: "approve", args: [launchAddress, parsedAmount] });
  }, [account, launchAddress, saleInfo?.paymentToken, parsedAmount, writeApprove]);

  const contribute = useCallback(async (amount: string) => {
    if (!account || !launchAddress) return;
    setError(null);
    const parsed = parseUnits(amount, 18);
    const isETH = !saleInfo?.paymentToken || saleInfo.paymentToken === "0x0000000000000000000000000000000000000000";
    writeLaunch({ address: launchAddress, abi: FAIR_LAUNCH_ABI, functionName: "commit", args: [isETH ? BigInt(0) : parsed], value: isETH ? parsed : undefined });
  }, [account, launchAddress, saleInfo?.paymentToken, writeLaunch]);

  const claim = useCallback(async () => {
    if (!account || !launchAddress) return;
    setError(null);
    writeLaunch({ address: launchAddress, abi: FAIR_LAUNCH_ABI, functionName: "claim", args: [] });
  }, [account, launchAddress, writeLaunch]);

  const withdraw = useCallback(async () => {
    if (!account || !launchAddress) return;
    setError(null);
    writeLaunch({ address: launchAddress, abi: FAIR_LAUNCH_ABI, functionName: "withdraw", args: [] });
  }, [account, launchAddress, writeLaunch]);

  const refetch = useCallback(() => { refetchSaleInfo(); refetchSaleStatus(); refetchCommitment(); refetchAllowance(); }, [refetchSaleInfo, refetchSaleStatus, refetchCommitment, refetchAllowance]);

  return {
    launchInfo, userLaunchInfo, isActive, softCapReached,
    contribute, claim, withdraw, needsApproval,
    isApproving: isApprovePending || isApproveConfirming,
    isContributing: isLaunchPending, isConfirming: isLaunchConfirming, isSuccess: isLaunchSuccess,
    approve, refetch, error,
  };
}
