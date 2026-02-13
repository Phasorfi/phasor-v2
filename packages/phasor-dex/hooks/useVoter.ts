import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { Address } from "viem";
import { PoolVoteInfo, EpochInfo } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { VOTER_ABI } from "@/config/abis/voter";
import { POOL_ABI, ERC20_ABI } from "@/config/abis";

export function useVoter(selectedTokenId?: bigint) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const voterAddress = CONTRACTS.VOTER;

  // Pool count from Voter
  const { data: poolCount = BigInt(0) } = useReadContract({
    address: voterAddress,
    abi: VOTER_ABI,
    functionName: "length",
    query: { enabled: !!voterAddress },
  });

  const count = Number(poolCount);

  // Multicall pools(i) for all indices
  const poolContracts = useMemo(() => {
    if (!voterAddress || count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "pools" as const,
      args: [BigInt(i)] as const,
    }));
  }, [voterAddress, count]);

  const { data: poolResults } = useReadContracts({
    contracts: poolContracts,
    query: { enabled: poolContracts.length > 0 },
  });

  const poolAddresses = useMemo((): Address[] => {
    if (!poolResults) return [];
    return poolResults
      .filter((r) => r.status === "success")
      .map((r) => r.result as Address);
  }, [poolResults]);

  // For each pool: gauge, weight, isAlive, token0, token1, stable, gaugeToFees, gaugeToIncentive
  const poolDetailContracts = useMemo(() => {
    if (!voterAddress || poolAddresses.length === 0) return [];
    return poolAddresses.flatMap((pool) => [
      { address: voterAddress, abi: VOTER_ABI, functionName: "gauges" as const, args: [pool] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "weights" as const, args: [pool] as const },
      { address: pool, abi: POOL_ABI, functionName: "token0" as const },
      { address: pool, abi: POOL_ABI, functionName: "token1" as const },
      { address: pool, abi: POOL_ABI, functionName: "stable" as const },
    ]);
  }, [voterAddress, poolAddresses]);

  const { data: poolDetailResults } = useReadContracts({
    contracts: poolDetailContracts,
    query: { enabled: poolDetailContracts.length > 0 },
  });

  // Get gauge addresses to query isAlive, feeAddress, incentiveAddress
  const gaugeAddresses = useMemo((): Address[] => {
    if (!poolDetailResults) return [];
    return poolAddresses.map((_, i) => {
      const gaugeResult = poolDetailResults[i * 5];
      return gaugeResult?.status === "success" ? (gaugeResult.result as Address) : ("0x0000000000000000000000000000000000000000" as Address);
    });
  }, [poolDetailResults, poolAddresses]);

  const gaugeDetailContracts = useMemo(() => {
    if (!voterAddress || gaugeAddresses.length === 0) return [];
    return gaugeAddresses.flatMap((gauge) => [
      { address: voterAddress, abi: VOTER_ABI, functionName: "isAlive" as const, args: [gauge] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "gaugeToFees" as const, args: [gauge] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "gaugeToIncentive" as const, args: [gauge] as const },
    ]);
  }, [voterAddress, gaugeAddresses]);

  const { data: gaugeDetailResults } = useReadContracts({
    contracts: gaugeDetailContracts,
    query: { enabled: gaugeDetailContracts.length > 0 },
  });

  // Get token symbols for each pool
  const tokenAddresses = useMemo((): Address[] => {
    if (!poolDetailResults) return [];
    const set = new Set<Address>();
    poolAddresses.forEach((_, i) => {
      const t0 = poolDetailResults[i * 5 + 2];
      const t1 = poolDetailResults[i * 5 + 3];
      if (t0?.status === "success") set.add(t0.result as Address);
      if (t1?.status === "success") set.add(t1.result as Address);
    });
    return Array.from(set);
  }, [poolDetailResults, poolAddresses]);

  const tokenSymbolContracts = useMemo(() => {
    return tokenAddresses.map((addr) => ({
      address: addr,
      abi: ERC20_ABI,
      functionName: "symbol" as const,
    }));
  }, [tokenAddresses]);

  const { data: tokenSymbolResults } = useReadContracts({
    contracts: tokenSymbolContracts,
    query: { enabled: tokenSymbolContracts.length > 0 },
  });

  const symbolMap = useMemo((): Record<string, string> => {
    const map: Record<string, string> = {};
    tokenAddresses.forEach((addr, i) => {
      if (tokenSymbolResults?.[i]?.status === "success") {
        map[addr.toLowerCase()] = tokenSymbolResults[i].result as string;
      }
    });
    return map;
  }, [tokenAddresses, tokenSymbolResults]);

  // Total weight
  const { data: totalWeight = BigInt(0) } = useReadContract({
    address: voterAddress,
    abi: VOTER_ABI,
    functionName: "totalWeight",
    query: { enabled: !!voterAddress },
  });

  // Epoch info
  const nowTimestamp = BigInt(Math.floor(Date.now() / 1000));
  const epochContracts = useMemo(() => {
    if (!voterAddress) return [];
    return [
      { address: voterAddress, abi: VOTER_ABI, functionName: "epochStart" as const, args: [nowTimestamp] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "epochNext" as const, args: [nowTimestamp] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "epochVoteStart" as const, args: [nowTimestamp] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "epochVoteEnd" as const, args: [nowTimestamp] as const },
    ];
  }, [voterAddress, nowTimestamp]);

  const { data: epochResults } = useReadContracts({
    contracts: epochContracts,
    query: { enabled: epochContracts.length > 0 },
  });

  const epochInfo = useMemo((): EpochInfo | null => {
    if (!epochResults) return null;
    return {
      epochStart: epochResults[0]?.status === "success" ? Number(epochResults[0].result) : 0,
      epochEnd: epochResults[1]?.status === "success" ? Number(epochResults[1].result) : 0,
      voteStart: epochResults[2]?.status === "success" ? Number(epochResults[2].result) : 0,
      voteEnd: epochResults[3]?.status === "success" ? Number(epochResults[3].result) : 0,
    };
  }, [epochResults]);

  // Per-NFT voting data
  const nftVoteContracts = useMemo(() => {
    if (!voterAddress || !selectedTokenId || poolAddresses.length === 0) return [];
    return [
      { address: voterAddress, abi: VOTER_ABI, functionName: "usedWeights" as const, args: [selectedTokenId] as const },
      { address: voterAddress, abi: VOTER_ABI, functionName: "lastVoted" as const, args: [selectedTokenId] as const },
      ...poolAddresses.map((pool) => ({
        address: voterAddress,
        abi: VOTER_ABI,
        functionName: "votes" as const,
        args: [selectedTokenId, pool] as const,
      })),
    ];
  }, [voterAddress, selectedTokenId, poolAddresses]);

  const { data: nftVoteResults, refetch: refetchVotes } = useReadContracts({
    contracts: nftVoteContracts,
    query: { enabled: nftVoteContracts.length > 0 },
  });

  const usedWeights = nftVoteResults?.[0]?.status === "success" ? (nftVoteResults[0].result as bigint) : BigInt(0);
  const lastVoted = nftVoteResults?.[1]?.status === "success" ? Number(nftVoteResults[1].result) : 0;

  // Combine into PoolVoteInfo[]
  const poolVoteInfos = useMemo((): PoolVoteInfo[] => {
    if (!poolDetailResults || poolAddresses.length === 0) return [];
    return poolAddresses.map((pool, i) => {
      const gauge = gaugeAddresses[i] ?? ("0x0000000000000000000000000000000000000000" as Address);
      const weight = poolDetailResults[i * 5 + 1]?.status === "success" ? (poolDetailResults[i * 5 + 1].result as bigint) : BigInt(0);
      const token0Addr = poolDetailResults[i * 5 + 2]?.status === "success" ? (poolDetailResults[i * 5 + 2].result as Address) : ("" as Address);
      const token1Addr = poolDetailResults[i * 5 + 3]?.status === "success" ? (poolDetailResults[i * 5 + 3].result as Address) : ("" as Address);
      const isStable = poolDetailResults[i * 5 + 4]?.status === "success" ? (poolDetailResults[i * 5 + 4].result as boolean) : false;
      const isAlive = gaugeDetailResults?.[i * 3]?.status === "success" ? (gaugeDetailResults[i * 3].result as boolean) : false;
      const feeAddress = gaugeDetailResults?.[i * 3 + 1]?.status === "success" ? (gaugeDetailResults[i * 3 + 1].result as Address) : ("0x0000000000000000000000000000000000000000" as Address);
      const incentiveAddress = gaugeDetailResults?.[i * 3 + 2]?.status === "success" ? (gaugeDetailResults[i * 3 + 2].result as Address) : ("0x0000000000000000000000000000000000000000" as Address);

      const userVote = nftVoteResults && nftVoteResults.length > i + 2 && nftVoteResults[i + 2]?.status === "success"
        ? (nftVoteResults[i + 2].result as bigint) : BigInt(0);

      return {
        pool,
        gauge,
        token0Symbol: symbolMap[token0Addr.toLowerCase()] ?? "???",
        token1Symbol: symbolMap[token1Addr.toLowerCase()] ?? "???",
        isStable,
        isAlive,
        weight,
        weightPercent: totalWeight > BigInt(0) ? Number((weight * BigInt(10000)) / totalWeight) / 100 : 0,
        userVote,
        feeAddress,
        incentiveAddress,
      };
    });
  }, [poolAddresses, poolDetailResults, gaugeAddresses, gaugeDetailResults, symbolMap, totalWeight, nftVoteResults]);

  // Write hooks
  const { writeContract: writeVoter, data: voterHash, isPending: isVotePending, error: voteError } = useWriteContract();
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({ hash: voterHash });

  useEffect(() => { if (voteError) setError(voteError.message); }, [voteError]);
  useEffect(() => { if (isVoteSuccess) setTimeout(() => refetchVotes(), 500); }, [isVoteSuccess, refetchVotes]);

  const vote = useCallback(async (tokenId: bigint, pools: Address[], weights: bigint[]) => {
    if (!account || !voterAddress) return;
    setError(null);
    writeVoter({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "vote",
      args: [tokenId, pools, weights],
    });
  }, [account, voterAddress, writeVoter]);

  const reset = useCallback(async (tokenId: bigint) => {
    if (!account || !voterAddress) return;
    setError(null);
    writeVoter({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "reset",
      args: [tokenId],
    });
  }, [account, voterAddress, writeVoter]);

  const poke = useCallback(async (tokenId: bigint) => {
    if (!account || !voterAddress) return;
    setError(null);
    writeVoter({
      address: voterAddress,
      abi: VOTER_ABI,
      functionName: "poke",
      args: [tokenId],
    });
  }, [account, voterAddress, writeVoter]);

  return {
    poolVoteInfos,
    totalWeight,
    epochInfo,
    usedWeights,
    lastVoted,
    isVoting: isVotePending || isVoteConfirming,
    isVoteSuccess,
    vote,
    reset,
    poke,
    refetch: refetchVotes,
    error,
  };
}
