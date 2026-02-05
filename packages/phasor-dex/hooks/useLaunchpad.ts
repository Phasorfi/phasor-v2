import { useState, useMemo, useCallback, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { Address, erc20Abi, parseUnits } from "viem";
import { LaunchInfo, AuctionInfo, AuctionStatus, LaunchState, UserLaunchInfo } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { MISO_MARKET_ABI } from "@/config/abis/launchpadFactory";
import { MISO_AUCTION_ABI } from "@/config/abis/fairLaunch";

export function useLaunchpad() {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const { data: launchAddresses = [], refetch: refetchLaunches, isLoading } = useReadContract({
    address: CONTRACTS.MISO_MARKET, abi: MISO_MARKET_ABI, functionName: "getMarkets",
    query: { enabled: !!CONTRACTS.MISO_MARKET },
  });

  const { data: launchCount = BigInt(0) } = useReadContract({
    address: CONTRACTS.MISO_MARKET, abi: MISO_MARKET_ABI, functionName: "numberOfAuctions",
    query: { enabled: !!CONTRACTS.MISO_MARKET },
  });

  return { launchAddresses: launchAddresses as Address[], launchCount: Number(launchCount), isLoading, refetch: refetchLaunches, error };
}

export function useAuction(auctionAddress: Address | null, contributeAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);

  const parsedAmount = useMemo(() => {
    if (!contributeAmount) return BigInt(0);
    try { return parseUnits(contributeAmount, 18); } catch { return BigInt(0); }
  }, [contributeAmount]);

  // ---- Base information ----

  const { data: baseInfo, refetch: refetchBaseInfo } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "getBaseInformation",
    query: { enabled: !!auctionAddress },
  });

  const { data: totalTokens = BigInt(0) } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "getTotalTokens",
    query: { enabled: !!auctionAddress },
  });

  const { data: paymentCurrency } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "paymentCurrency",
    query: { enabled: !!auctionAddress },
  });

  // ---- Auction type (from MISOMarket factory) ----

  const { data: auctionType = BigInt(0) } = useReadContract({
    address: CONTRACTS.MISO_MARKET, abi: MISO_MARKET_ABI, functionName: "getMarketTemplateId",
    args: auctionAddress ? [auctionAddress] : undefined,
    query: { enabled: !!auctionAddress && !!CONTRACTS.MISO_MARKET },
  });

  // ---- Status ----

  const { data: commitmentsTotal = BigInt(0), refetch: refetchCommitmentsTotal } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "commitmentsTotal",
    query: { enabled: !!auctionAddress },
  });

  const { data: auctionSuccessful = false } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "auctionSuccessful",
    query: { enabled: !!auctionAddress },
  });

  const { data: auctionEnded = false } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "auctionEnded",
    query: { enabled: !!auctionAddress },
  });

  const { data: isFinalized = false } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "finalized",
    query: { enabled: !!auctionAddress },
  });

  const { data: tokenPrice = BigInt(0) } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "tokenPrice",
    query: { enabled: !!auctionAddress },
  });

  // ---- Crowdsale goal (may revert for non-Crowdsale types, that's ok) ----

  const { data: goal = BigInt(0) } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "goal",
    query: { enabled: !!auctionAddress && Number(auctionType) === 1 },
  });

  // ---- Per-user ----

  const { data: userCommitment = BigInt(0), refetch: refetchCommitment } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "commitments",
    args: account ? [account] : undefined, query: { enabled: !!auctionAddress && !!account },
  });

  const { data: userTokensClaimable = BigInt(0) } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "tokensClaimable",
    args: account ? [account] : undefined, query: { enabled: !!auctionAddress && !!account },
  });

  const { data: userClaimed = BigInt(0) } = useReadContract({
    address: auctionAddress as Address, abi: MISO_AUCTION_ABI, functionName: "claimed",
    args: account ? [account] : undefined, query: { enabled: !!auctionAddress && !!account },
  });

  // ---- Payment token allowance (for token-based auctions) ----

  const isETHPayment = !paymentCurrency || paymentCurrency === "0x0000000000000000000000000000000000000000";

  const { data: paymentAllowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: paymentCurrency as Address, abi: erc20Abi, functionName: "allowance",
    args: account && auctionAddress ? [account, auctionAddress] : undefined,
    query: { enabled: !!account && !!auctionAddress && !isETHPayment },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    if (isETHPayment) return false;
    return paymentAllowance < parsedAmount;
  }, [paymentAllowance, parsedAmount, isETHPayment]);

  // ---- Derived state ----

  const launchState = useMemo((): LaunchState => {
    if (!baseInfo) return "pending";
    const now = Math.floor(Date.now() / 1000);
    const startTime = Number(baseInfo[2]);
    const endTime = Number(baseInfo[3]);
    const finalized = baseInfo[4] as boolean;
    if (finalized || isFinalized) return "finalized";
    if (now < startTime) return "pending";
    if (now <= endTime && !auctionEnded) return "active";
    if (auctionSuccessful) return "success";
    return "failed";
  }, [baseInfo, auctionSuccessful, auctionEnded, isFinalized]);

  const auctionInfo = useMemo((): AuctionInfo | null => {
    if (!baseInfo || !paymentCurrency) return null;
    return {
      auctionToken: baseInfo[0] as Address,
      paymentCurrency,
      totalTokens: totalTokens,
      startTime: Number(baseInfo[2]),
      endTime: Number(baseInfo[3]),
      auctionType: Number(auctionType),
      goal,
    };
  }, [baseInfo, paymentCurrency, totalTokens, auctionType, goal]);

  const auctionStatus = useMemo((): AuctionStatus | null => {
    return {
      commitmentsTotal,
      auctionSuccessful,
      auctionEnded,
      finalized: isFinalized,
      tokenPrice,
    };
  }, [commitmentsTotal, auctionSuccessful, auctionEnded, isFinalized, tokenPrice]);

  const launchInfo = useMemo((): LaunchInfo | null => {
    if (!auctionAddress || !auctionInfo || !auctionStatus) return null;
    return { address: auctionAddress, auctionInfo, auctionStatus, state: launchState };
  }, [auctionAddress, auctionInfo, auctionStatus, launchState]);

  const userLaunchInfo = useMemo((): UserLaunchInfo | null => {
    if (!account) return null;
    return { commitment: userCommitment, tokensClaimable: userTokensClaimable, claimed: userClaimed };
  }, [account, userCommitment, userTokensClaimable, userClaimed]);

  // ---- Write hooks ----

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeAction, data: actionHash, isPending: isActionPending, error: actionError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({ hash: actionHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (actionError) setError(actionError.message); }, [actionError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isActionSuccess) setTimeout(() => { refetchCommitmentsTotal(); refetchCommitment(); refetchBaseInfo(); }, 500); }, [isActionSuccess, refetchCommitmentsTotal, refetchCommitment, refetchBaseInfo]);

  // ---- Actions ----

  const approve = useCallback(async () => {
    if (!account || !auctionAddress || !paymentCurrency || isETHPayment) return;
    setError(null);
    writeApprove({ address: paymentCurrency, abi: erc20Abi, functionName: "approve", args: [auctionAddress, parsedAmount] });
  }, [account, auctionAddress, paymentCurrency, isETHPayment, parsedAmount, writeApprove]);

  const contribute = useCallback(async (amount: string) => {
    if (!account || !auctionAddress) return;
    setError(null);
    const parsed = parseUnits(amount, 18);
    if (isETHPayment) {
      writeAction({ address: auctionAddress, abi: MISO_AUCTION_ABI, functionName: "commitEth", args: [account, true], value: parsed });
    } else {
      writeAction({ address: auctionAddress, abi: MISO_AUCTION_ABI, functionName: "commitTokens", args: [parsed, true] });
    }
  }, [account, auctionAddress, isETHPayment, writeAction]);

  const claim = useCallback(async () => {
    if (!account || !auctionAddress) return;
    setError(null);
    writeAction({ address: auctionAddress, abi: MISO_AUCTION_ABI, functionName: "withdrawTokens", args: [] });
  }, [account, auctionAddress, writeAction]);

  // In MISO, withdrawTokens handles both claim and refund
  const withdraw = claim;

  const refetch = useCallback(() => {
    refetchBaseInfo(); refetchCommitmentsTotal(); refetchCommitment(); refetchAllowance();
  }, [refetchBaseInfo, refetchCommitmentsTotal, refetchCommitment, refetchAllowance]);

  return {
    launchInfo, userLaunchInfo,
    isActive: launchState === "active",
    auctionSuccessful,
    contribute, claim, withdraw, needsApproval,
    isApproving: isApprovePending || isApproveConfirming,
    isContributing: isActionPending, isConfirming: isActionConfirming, isSuccess: isActionSuccess,
    approve, refetch, error,
  };
}

// Backward-compatible alias
export const useFairLaunch = useAuction;
