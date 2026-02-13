import { useState, useMemo, useCallback, useEffect } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useReadContracts,
} from "wagmi";
import { Address, erc20Abi, parseUnits } from "viem";
import { SaleInfo, SaleState, SaleTokenMeta, UserSaleInfo } from "@/types";
import { CONTRACTS } from "@/config/chains";
import { VELODROME_LAUNCHER_ABI } from "@/config/abis/velodromeLauncher";
import { ERC20_ABI } from "@/config/abis";

// ============================================
// Derive sale state from on-chain data
// ============================================

function deriveSaleState(sale: SaleInfo): SaleState {
  if (sale.cancelled) return "cancelled";
  if (sale.finalized) return "finalized";
  const now = Math.floor(Date.now() / 1000);
  if (now < sale.startTime) return "pending";
  if (now <= sale.endTime) return "active";
  // Ended but not finalized
  if (sale.raised >= sale.softCap) return "success";
  return "failed";
}

// ============================================
// useLaunchpad - List all sales
// ============================================

export interface LaunchpadSale {
  sale: SaleInfo;
  state: SaleState;
  tokenMeta?: SaleTokenMeta;
  baseTokenMeta?: SaleTokenMeta;
}

export function useLaunchpad() {
  const launcherAddress = CONTRACTS.VELODROME_LAUNCHER;

  const { data: saleCount = BigInt(0), isLoading: isCountLoading } = useReadContract({
    address: launcherAddress,
    abi: VELODROME_LAUNCHER_ABI,
    functionName: "saleCount",
    query: { enabled: !!launcherAddress },
  });

  const count = Number(saleCount);

  // Multicall getSale for each saleId
  const saleContracts = useMemo(() => {
    if (!launcherAddress || count === 0) return [];
    return Array.from({ length: count }, (_, i) => ({
      address: launcherAddress,
      abi: VELODROME_LAUNCHER_ABI,
      functionName: "getSale" as const,
      args: [BigInt(i)] as const,
    }));
  }, [launcherAddress, count]);

  const { data: saleResults, isLoading: isSalesLoading, refetch: refetchSales } = useReadContracts({
    contracts: saleContracts,
    query: { enabled: saleContracts.length > 0 },
  });

  // Parse sale data into SaleInfo[]
  const sales = useMemo((): SaleInfo[] => {
    if (!saleResults) return [];
    return saleResults
      .map((result, i) => {
        if (result.status !== "success" || !result.result) return null;
        const r = result.result as readonly [Address, Address, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
        return {
          saleId: i,
          token: r[0],
          baseToken: r[1],
          tokenAmount: r[2],
          price: r[3],
          raised: r[4],
          softCap: r[5],
          hardCap: r[6],
          startTime: Number(r[7]),
          endTime: Number(r[8]),
          finalized: r[9],
          cancelled: r[10],
        } satisfies SaleInfo;
      })
      .filter((s): s is SaleInfo => s !== null);
  }, [saleResults]);

  // Batch ERC20 metadata for all unique token addresses
  const tokenAddresses = useMemo(() => {
    const set = new Set<Address>();
    sales.forEach((s) => {
      set.add(s.token);
      if (s.baseToken !== "0x0000000000000000000000000000000000000000") {
        set.add(s.baseToken);
      }
    });
    return Array.from(set);
  }, [sales]);

  const metaContracts = useMemo(() => {
    return tokenAddresses.flatMap((addr) => [
      { address: addr, abi: ERC20_ABI, functionName: "symbol" as const },
      { address: addr, abi: ERC20_ABI, functionName: "name" as const },
      { address: addr, abi: ERC20_ABI, functionName: "decimals" as const },
    ]);
  }, [tokenAddresses]);

  const { data: metaResults } = useReadContracts({
    contracts: metaContracts,
    query: { enabled: metaContracts.length > 0 },
  });

  const tokenMetaMap = useMemo((): Record<string, SaleTokenMeta> => {
    const map: Record<string, SaleTokenMeta> = {};
    if (!metaResults) return map;
    tokenAddresses.forEach((addr, i) => {
      const base = i * 3;
      const symbol = metaResults[base]?.result as string | undefined;
      const name = metaResults[base + 1]?.result as string | undefined;
      const decimals = metaResults[base + 2]?.result as number | undefined;
      if (symbol && name && decimals !== undefined) {
        map[addr.toLowerCase()] = { symbol, name, decimals };
      }
    });
    return map;
  }, [metaResults, tokenAddresses]);

  // Combine into LaunchpadSale[]
  const launchpadSales = useMemo((): LaunchpadSale[] => {
    return sales.map((sale) => ({
      sale,
      state: deriveSaleState(sale),
      tokenMeta: tokenMetaMap[sale.token.toLowerCase()],
      baseTokenMeta: sale.baseToken !== "0x0000000000000000000000000000000000000000"
        ? tokenMetaMap[sale.baseToken.toLowerCase()]
        : undefined,
    }));
  }, [sales, tokenMetaMap]);

  return {
    sales: launchpadSales,
    saleCount: count,
    isLoading: isCountLoading || isSalesLoading,
    refetch: refetchSales,
  };
}

// ============================================
// useSale - Single sale detail + write actions
// ============================================

export function useSale(saleId: number | null, contributeAmount?: string) {
  const { address: account } = useAccount();
  const [error, setError] = useState<string | null>(null);
  const launcherAddress = CONTRACTS.VELODROME_LAUNCHER;

  const parsedAmount = useMemo(() => {
    if (!contributeAmount) return BigInt(0);
    try { return parseUnits(contributeAmount, 18); } catch { return BigInt(0); }
  }, [contributeAmount]);

  // ---- Sale data ----

  const { data: saleData, refetch: refetchSale } = useReadContract({
    address: launcherAddress,
    abi: VELODROME_LAUNCHER_ABI,
    functionName: "getSale",
    args: saleId !== null ? [BigInt(saleId)] : undefined,
    query: { enabled: saleId !== null && !!launcherAddress },
  });

  const sale = useMemo((): SaleInfo | null => {
    if (saleId === null || !saleData) return null;
    const r = saleData as readonly [Address, Address, bigint, bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean];
    return {
      saleId,
      token: r[0],
      baseToken: r[1],
      tokenAmount: r[2],
      price: r[3],
      raised: r[4],
      softCap: r[5],
      hardCap: r[6],
      startTime: Number(r[7]),
      endTime: Number(r[8]),
      finalized: r[9],
      cancelled: r[10],
    };
  }, [saleId, saleData]);

  const saleState = useMemo((): SaleState => {
    if (!sale) return "pending";
    return deriveSaleState(sale);
  }, [sale]);

  // ---- Token metadata ----

  const tokenMetaContracts = useMemo(() => {
    if (!sale) return [];
    const contracts: { address: Address; abi: typeof ERC20_ABI; functionName: "symbol" | "name" | "decimals" }[] = [
      { address: sale.token, abi: ERC20_ABI, functionName: "symbol" },
      { address: sale.token, abi: ERC20_ABI, functionName: "name" },
      { address: sale.token, abi: ERC20_ABI, functionName: "decimals" },
    ];
    if (sale.baseToken !== "0x0000000000000000000000000000000000000000") {
      contracts.push(
        { address: sale.baseToken, abi: ERC20_ABI, functionName: "symbol" },
        { address: sale.baseToken, abi: ERC20_ABI, functionName: "name" },
        { address: sale.baseToken, abi: ERC20_ABI, functionName: "decimals" },
      );
    }
    return contracts;
  }, [sale]);

  const { data: tokenMetaResults } = useReadContracts({
    contracts: tokenMetaContracts,
    query: { enabled: tokenMetaContracts.length > 0 },
  });

  const tokenMeta = useMemo((): SaleTokenMeta | undefined => {
    if (!tokenMetaResults || tokenMetaResults.length < 3) return undefined;
    const symbol = tokenMetaResults[0]?.result as string | undefined;
    const name = tokenMetaResults[1]?.result as string | undefined;
    const decimals = tokenMetaResults[2]?.result as number | undefined;
    if (symbol && name && decimals !== undefined) return { symbol, name, decimals };
    return undefined;
  }, [tokenMetaResults]);

  const baseTokenMeta = useMemo((): SaleTokenMeta | undefined => {
    if (!tokenMetaResults || tokenMetaResults.length < 6) return undefined;
    const symbol = tokenMetaResults[3]?.result as string | undefined;
    const name = tokenMetaResults[4]?.result as string | undefined;
    const decimals = tokenMetaResults[5]?.result as number | undefined;
    if (symbol && name && decimals !== undefined) return { symbol, name, decimals };
    return undefined;
  }, [tokenMetaResults]);

  // ---- User data ----

  const { data: userContribution = BigInt(0), refetch: refetchContribution } = useReadContract({
    address: launcherAddress,
    abi: VELODROME_LAUNCHER_ABI,
    functionName: "getContribution",
    args: saleId !== null && account ? [BigInt(saleId), account] : undefined,
    query: { enabled: saleId !== null && !!account && !!launcherAddress },
  });

  const { data: canParticipate = false } = useReadContract({
    address: launcherAddress,
    abi: VELODROME_LAUNCHER_ABI,
    functionName: "canParticipate",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !!launcherAddress },
  });

  const userSaleInfo = useMemo((): UserSaleInfo | null => {
    if (!account) return null;
    return {
      contribution: userContribution as bigint,
      canParticipate: canParticipate as boolean,
    };
  }, [account, userContribution, canParticipate]);

  // ---- BaseToken allowance (ERC20 approval) ----

  const { data: allowance = BigInt(0), refetch: refetchAllowance } = useReadContract({
    address: sale?.baseToken,
    abi: erc20Abi,
    functionName: "allowance",
    args: account && launcherAddress ? [account, launcherAddress] : undefined,
    query: { enabled: !!account && !!launcherAddress && !!sale?.baseToken && sale.baseToken !== "0x0000000000000000000000000000000000000000" },
  });

  const needsApproval = useMemo(() => {
    if (!parsedAmount || parsedAmount === BigInt(0)) return false;
    if (!sale || sale.baseToken === "0x0000000000000000000000000000000000000000") return false;
    return (allowance as bigint) < parsedAmount;
  }, [allowance, parsedAmount, sale]);

  // ---- BaseToken balance ----

  const { data: baseTokenBalance = BigInt(0) } = useReadContract({
    address: sale?.baseToken,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: account ? [account] : undefined,
    query: { enabled: !!account && !!sale?.baseToken && sale.baseToken !== "0x0000000000000000000000000000000000000000" },
  });

  // ---- Write hooks ----

  const { writeContract: writeApprove, data: approveHash, isPending: isApprovePending, error: approveError } = useWriteContract();
  const { writeContract: writeAction, data: actionHash, isPending: isActionPending, error: actionError } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isActionConfirming, isSuccess: isActionSuccess } = useWaitForTransactionReceipt({ hash: actionHash });

  useEffect(() => { if (approveError) setError(approveError.message); }, [approveError]);
  useEffect(() => { if (actionError) setError(actionError.message); }, [actionError]);
  useEffect(() => { if (isApproveSuccess) setTimeout(() => refetchAllowance(), 500); }, [isApproveSuccess, refetchAllowance]);
  useEffect(() => { if (isActionSuccess) setTimeout(() => { refetchSale(); refetchContribution(); }, 500); }, [isActionSuccess, refetchSale, refetchContribution]);

  // ---- Actions ----

  const approve = useCallback(async () => {
    if (!account || !launcherAddress || !sale) return;
    setError(null);
    writeApprove({
      address: sale.baseToken,
      abi: erc20Abi,
      functionName: "approve",
      args: [launcherAddress, parsedAmount],
    });
  }, [account, launcherAddress, sale, parsedAmount, writeApprove]);

  const contribute = useCallback(async (amount: string) => {
    if (!account || !launcherAddress || saleId === null) return;
    setError(null);
    const parsed = parseUnits(amount, baseTokenMeta?.decimals ?? 18);
    writeAction({
      address: launcherAddress,
      abi: VELODROME_LAUNCHER_ABI,
      functionName: "contribute",
      args: [BigInt(saleId), parsed],
    });
  }, [account, launcherAddress, saleId, baseTokenMeta, writeAction]);

  const claim = useCallback(async () => {
    if (!account || !launcherAddress || saleId === null) return;
    setError(null);
    writeAction({
      address: launcherAddress,
      abi: VELODROME_LAUNCHER_ABI,
      functionName: "claim",
      args: [BigInt(saleId)],
    });
  }, [account, launcherAddress, saleId, writeAction]);

  const refund = useCallback(async () => {
    if (!account || !launcherAddress || saleId === null) return;
    setError(null);
    writeAction({
      address: launcherAddress,
      abi: VELODROME_LAUNCHER_ABI,
      functionName: "refund",
      args: [BigInt(saleId)],
    });
  }, [account, launcherAddress, saleId, writeAction]);

  const refetch = useCallback(() => {
    refetchSale();
    refetchContribution();
    refetchAllowance();
  }, [refetchSale, refetchContribution, refetchAllowance]);

  return {
    sale,
    saleState,
    tokenMeta,
    baseTokenMeta,
    userSaleInfo,
    baseTokenBalance: baseTokenBalance as bigint,
    needsApproval,
    isApproving: isApprovePending || isApproveConfirming,
    isContributing: isActionPending,
    isConfirming: isActionConfirming,
    isSuccess: isActionSuccess,
    approve,
    contribute,
    claim,
    refund,
    refetch,
    error,
  };
}
