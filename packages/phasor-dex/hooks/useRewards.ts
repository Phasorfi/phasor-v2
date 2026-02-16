import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContracts,
} from "wagmi";
import { Address } from "viem";
import { RebaseReward } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { REWARDS_DISTRIBUTOR_ABI } from "@/config/abis/rewardsDistributor";
import { VOTER_ABI } from "@/config/abis/voter";

export function useRewards(tokenIds: bigint[]) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const rewardsDistributor = CONTRACTS.REWARDS_DISTRIBUTOR;
  const voterAddress = CONTRACTS.VOTER;

  // Rebase rewards: claimable(tokenId) for each NFT
  const rebaseContracts = useMemo(() => {
    if (!rewardsDistributor || tokenIds.length === 0) return [];
    return tokenIds.map((tokenId) => ({
      address: rewardsDistributor,
      abi: REWARDS_DISTRIBUTOR_ABI,
      functionName: "claimable" as const,
      args: [tokenId] as const,
    }));
  }, [rewardsDistributor, tokenIds]);

  const { data: rebaseResults, refetch: refetchRebase } = useReadContracts({
    contracts: rebaseContracts,
    query: { enabled: rebaseContracts.length > 0 },
  });

  const rebaseRewards = useMemo((): RebaseReward[] => {
    if (!rebaseResults) return [];
    return tokenIds.map((tokenId, i) => ({
      tokenId,
      claimable: rebaseResults[i]?.status === "success"
        ? (rebaseResults[i].result as bigint)
        : BigInt(0),
    }));
  }, [tokenIds, rebaseResults]);

  const totalRebaseClaimable = useMemo(() => {
    return rebaseRewards.reduce((sum, r) => sum + r.claimable, BigInt(0));
  }, [rebaseRewards]);

  // Write hooks
  const { writeContract: writeReward, data: rewardHash, isPending: isClaimPending, error: claimError } = useWriteContract();
  const { isLoading: isClaimConfirming, isSuccess: isClaimSuccess } = useWaitForTransactionReceipt({ hash: rewardHash });

  useEffect(() => { if (claimError) setError(claimError.message); }, [claimError]);
  useEffect(() => { if (isClaimSuccess) setTimeout(() => refetchRebase(), 500); }, [isClaimSuccess, refetchRebase]);

  // Claim rebase for single NFT
  const claimRebase = useCallback(async (tokenId: bigint) => {
    if (!account || !rewardsDistributor) return;
    setError(null);
    writeReward({
      address: rewardsDistributor,
      abi: REWARDS_DISTRIBUTOR_ABI,
      functionName: "claim",
      args: [tokenId],
    });
  }, [account, rewardsDistributor, writeReward]);

  // Claim rebase for all NFTs
  const claimAllRebase = useCallback(async () => {
    if (!account || !rewardsDistributor || tokenIds.length === 0) return;
    setError(null);
    writeReward({
      address: rewardsDistributor,
      abi: REWARDS_DISTRIBUTOR_ABI,
      functionName: "claimMany",
      args: [tokenIds],
    });
  }, [account, rewardsDistributor, tokenIds, writeReward]);

  // Claim fees from voter
  const claimFees = useCallback(async (feeAddresses: Address[], tokens: Address[][], tokenId: bigint) => {
    if (!account || !voterAddress) return;
    setError(null);
    writeReward({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "claimFees",
      args: [feeAddresses, tokens, tokenId],
    });
  }, [account, voterAddress, writeReward]);

  // Claim incentives from voter
  const claimIncentives = useCallback(async (incentiveAddresses: Address[], tokens: Address[][], tokenId: bigint) => {
    if (!account || !voterAddress) return;
    setError(null);
    writeReward({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "claimIncentives",
      args: [incentiveAddresses, tokens, tokenId],
    });
  }, [account, voterAddress, writeReward]);

  return {
    rebaseRewards,
    totalRebaseClaimable,
    isClaiming: isClaimPending || isClaimConfirming,
    isClaimSuccess,
    claimRebase,
    claimAllRebase,
    claimFees,
    claimIncentives,
    refetch: refetchRebase,
    error,
  };
}
